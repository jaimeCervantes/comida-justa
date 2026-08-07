import TranslationProviderError from "~/domain/errors/TranslationProviderError";
import type ITranslationService from "~/use_cases/common/ports/ITranslationService";
import type {
  TranslatedText,
  TranslationRequest,
} from "~/use_cases/common/ports/ITranslationService";

/**
 * Traduce publicaciones con Gemini.
 *
 * Sigue el mismo patrón que `GeminiEmbeddingService`: REST directo en vez de sumar el SDK, misma
 * cabecera `x-goog-api-key`, mismo `AbortController` con tiempo límite y un error de dominio
 * propio. Son ~40 líneas contra una dependencia más en el bundle del servidor.
 *
 * Se pide `application/json` con un esquema de respuesta explícito. Sin eso el modelo devuelve el
 * texto envuelto en explicaciones («Here is the translation: …») o dentro de un bloque de código, y
 * ese preámbulo acabaría publicado como el título del producto.
 */
export const GEMINI_TRANSLATION_MODEL = "gemini-2.5-flash";

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TRANSLATION_MODEL}:generateContent`;

/** Más generoso que el de embeddings: generar texto tarda más que vectorizarlo. */
const DEFAULT_TIMEOUT_MS = 30_000;

type GenerateContentResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

export type GeminiTranslationServiceOptions = {
  apiKey: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

/**
 * Las instrucciones son tan explícitas porque el texto es de un catálogo de comida real, y las tres
 * reglas de abajo salen de lo que hay hoy en `post_translations`: publicaciones con hashtags
 * (`#saludable`), con nombres de marca («Hazlo Sano») y con precios en pesos.
 */
function buildPrompt(request: TranslationRequest): string {
  return [
    `Translate a food-marketplace listing from ${request.sourceLocale} to ${request.targetLocale}.`,
    "",
    "Rules:",
    "- Translate the meaning, not word by word. It must read as if written by a native speaker.",
    "- Keep brand and product names untranslated (for example: Hazlo Sano, kombucha, kéfir).",
    "- Keep hashtags, but translate the word after the # when it is a common noun.",
    "- Keep numbers, prices and units exactly as they are. Do not convert currencies.",
    "- Do not add, remove or summarise information. Do not add a preamble.",
    "- PRESERVE THE LINE BREAKS. The body is plain text whose blank lines and single line",
    "  breaks are meaningful: reproduce them exactly, one for one, in the same positions.",
    "  Do not merge paragraphs into a single block.",
    "",
    `TITLE: ${request.title}`,
    `BODY: ${request.content}`,
  ].join("\n");
}

function countLineBreaks(text: string): number {
  return (text.match(/\n/g) ?? []).length;
}

/**
 * Falla si la traducción aplastó la estructura del original.
 *
 * No es una precaución teórica: la primera corrida real contra la base devolvió el texto de
 * "Alimentos que Mejoran tu Rendimiento Mental" con **cero** saltos de línea donde el original
 * tenía cuatro, dejando el título pegado al primer párrafo. El contenido se pinta respetando esos
 * saltos, así que perderlos convierte la publicación en un muro de texto.
 *
 * Es un error y no un aviso a propósito: la fila no se escribe, el backfill la reintenta y el
 * problema se ve. Guardar el texto aplastado sería una corrupción silenciosa, y nadie revisa 23
 * publicaciones a mano para descubrirla.
 *
 * Se tolera perder alguno —una traducción legítima puede unir dos líneas muy cortas— pero no la
 * mitad.
 */
function assertKeepsStructure(source: string, translated: string): void {
  const expected = countLineBreaks(source);
  if (expected === 0) return;

  const actual = countLineBreaks(translated);

  if (actual < Math.ceil(expected / 2)) {
    throw new TranslationProviderError(
      `Gemini collapsed the layout: ${expected} line breaks in, ${actual} out.`,
    );
  }
}

/**
 * Falla si el modelo devolvió el original sin tocar.
 *
 * Pasó en la corrida real: "¿Por Qué Comer Despacio es la Clave para Bajar de Peso?" volvió
 * idéntica, y como el slug sale del título traducido, acabó como
 * `…-bajar-de-peso-1` — una URL "inglesa" en español, con un `-1` que no significa nada.
 *
 * Se exige que **título y cuerpo a la vez** sean idénticos para declararlo fallo. Un título solo
 * puede legítimamente no cambiar («Kombucha», «Hazlo Sano»); que además el cuerpo entero coincida
 * carácter por carácter entre dos idiomas no pasa.
 */
function assertActuallyTranslated(
  request: TranslationRequest,
  translated: TranslatedText,
): void {
  const sameTitle = translated.title.trim() === request.title.trim();
  const sameContent = translated.content.trim() === request.content.trim();

  if (sameTitle && sameContent) {
    throw new TranslationProviderError(
      `Gemini returned the ${request.sourceLocale} text unchanged for ${request.targetLocale}.`,
    );
  }
}

export default class GeminiTranslationService implements ITranslationService {
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: GeminiTranslationServiceOptions) {
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async translate(request: TranslationRequest): Promise<TranslatedText> {
    if (!this.apiKey) {
      throw new TranslationProviderError("GEMINI_API_KEY is not configured.");
    }

    if (!request.title.trim() && !request.content.trim()) {
      throw new TranslationProviderError("Nothing to translate.");
    }

    const response = await this.post(request);

    if (!response.ok) {
      throw new TranslationProviderError(
        `Gemini responded ${response.status} ${response.statusText}`,
      );
    }

    let body: GenerateContentResponse;
    try {
      body = (await response.json()) as GenerateContentResponse;
    } catch (error) {
      throw new TranslationProviderError(
        "Gemini returned a malformed body.",
        error,
      );
    }

    const translated = this.parse(body);
    assertKeepsStructure(request.content, translated.content);
    assertActuallyTranslated(request, translated);

    return translated;
  }

  private parse(body: GenerateContentResponse): TranslatedText {
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new TranslationProviderError("Gemini returned no candidate.");
    }

    let parsed: Partial<TranslatedText>;
    try {
      parsed = JSON.parse(text) as Partial<TranslatedText>;
    } catch (error) {
      throw new TranslationProviderError(
        "Gemini did not return valid JSON.",
        error,
      );
    }

    /* Un título vacío dejaría la publicación sin encabezado en inglés, que es peor que no tener la
       traducción: el respaldo al español al menos enseña algo. */
    if (!parsed.title?.trim()) {
      throw new TranslationProviderError("Gemini returned an empty title.");
    }

    return {
      title: parsed.title.trim(),
      content: (parsed.content ?? "").trim(),
    };
  }

  private async post(request: TranslationRequest): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await this.fetchImpl(ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(request) }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                content: { type: "STRING" },
              },
              required: ["title", "content"],
            },
            // Traducir no es escribir: se quiere la lectura más literal posible, no variedad.
            temperature: 0,
          },
        }),
        signal: controller.signal,
      });
    } catch (error) {
      throw new TranslationProviderError("Gemini is unreachable.", error);
    } finally {
      clearTimeout(timeout);
    }
  }
}
