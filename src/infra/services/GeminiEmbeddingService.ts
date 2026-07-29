import { EMBEDDING_DIMENSIONS } from "~/domain/entities/post/embedding";
import EmbeddingProviderError from "~/domain/errors/EmbeddingProviderError";
import type IEmbeddingService from "~/use_cases/common/ports/IEmbeddingService";

/**
 * Vectoriza texto con **exactamente el mismo modelo y dimensión que el chatbot**
 * (`app/infrastructure/clients/embeddings.py`). No es una preferencia: los vectores del sitio y
 * los del bot se comparan entre sí dentro de `search_posts_semantic`, y dos modelos distintos
 * producen espacios distintos — la búsqueda seguiría "funcionando" y devolvería resultados sin
 * sentido, que es la peor forma de romperse.
 *
 * Por eso NO se usa `VertexEmbeddingService`, que apunta a `text-multilingual-embedding-002`.
 *
 * Se llama la API REST en vez de agregar el SDK: son ~20 líneas contra una dependencia más en el
 * bundle del servidor, y el contrato de `:embedContent` es estable.
 */
export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent`;

/** Publicar no puede quedarse colgado esperando a Gemini; pasado el límite se deja pendiente. */
const DEFAULT_TIMEOUT_MS = 10_000;

type EmbedContentResponse = {
  embedding?: { values?: number[] };
};

export type GeminiEmbeddingServiceOptions = {
  apiKey: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export default class GeminiEmbeddingService implements IEmbeddingService {
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: GeminiEmbeddingServiceOptions) {
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new EmbeddingProviderError("GEMINI_API_KEY is not configured.");
    }

    const response = await this.post(text);

    if (!response.ok) {
      throw new EmbeddingProviderError(
        `Gemini responded ${response.status} ${response.statusText}`,
      );
    }

    let body: EmbedContentResponse;
    try {
      body = (await response.json()) as EmbedContentResponse;
    } catch (error) {
      throw new EmbeddingProviderError(
        "Gemini returned a malformed body.",
        error,
      );
    }

    const values = body.embedding?.values;

    if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
      throw new EmbeddingProviderError(
        `Gemini returned ${values?.length ?? 0} dimensions, expected ${EMBEDDING_DIMENSIONS}.`,
      );
    }

    return values;
  }

  private async post(text: string): Promise<Response> {
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
          model: `models/${GEMINI_EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
          // Matryoshka: el modelo nace en 3072 dims y se trunca a las 768 de la columna.
          outputDimensionality: EMBEDDING_DIMENSIONS,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      throw new EmbeddingProviderError("Gemini is unreachable.", error);
    } finally {
      clearTimeout(timeout);
    }
  }
}
