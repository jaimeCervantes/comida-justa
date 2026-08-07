import { describe, expect, it, vi } from "vitest";
import TranslationProviderError from "~/domain/errors/TranslationProviderError";
import GeminiTranslationService from "./GeminiTranslationService";

const REQUEST = {
  title: "Suero natural",
  content: "Bebida fermentada de la casa.",
  sourceLocale: "es",
  targetLocale: "en",
};

function respondWith(payload: unknown, ok = true): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 503,
    statusText: ok ? "OK" : "Service Unavailable",
    json: async () => payload,
  }) as unknown as typeof fetch;
}

function candidate(text: string) {
  return { candidates: [{ content: { parts: [{ text }] } }] };
}

describe("GeminiTranslationService", () => {
  it("devuelve el título y el contenido traducidos", async () => {
    const service = new GeminiTranslationService({
      apiKey: "k",
      fetchImpl: respondWith(
        candidate(
          JSON.stringify({
            title: "Natural whey",
            content: "House fermented drink.",
          }),
        ),
      ),
    });

    await expect(service.translate(REQUEST)).resolves.toEqual({
      title: "Natural whey",
      content: "House fermented drink.",
    });
  });

  /**
   * Se pide `application/json` con esquema justamente para que el modelo no conteste con un
   * preámbulo. Si la respuesta llegara igualmente en prosa, publicarla como título sería peor que
   * quedarse sin traducción: el respaldo al español al menos enseña algo correcto.
   */
  it("rechaza una respuesta que no es JSON", async () => {
    const service = new GeminiTranslationService({
      apiKey: "k",
      fetchImpl: respondWith(
        candidate("Here is the translation: Natural whey"),
      ),
    });

    await expect(service.translate(REQUEST)).rejects.toBeInstanceOf(
      TranslationProviderError,
    );
  });

  it("rechaza un título vacío", async () => {
    const service = new GeminiTranslationService({
      apiKey: "k",
      fetchImpl: respondWith(
        candidate(JSON.stringify({ title: "   ", content: "algo" })),
      ),
    });

    await expect(service.translate(REQUEST)).rejects.toThrow(/empty title/i);
  });

  it("acepta un cuerpo vacío: hay publicaciones que son solo título", async () => {
    const service = new GeminiTranslationService({
      apiKey: "k",
      fetchImpl: respondWith(
        candidate(JSON.stringify({ title: "Natural whey", content: "" })),
      ),
    });

    await expect(service.translate(REQUEST)).resolves.toEqual({
      title: "Natural whey",
      content: "",
    });
  });

  it("falla sin clave, y lo dice antes de gastar una llamada", async () => {
    const fetchImpl = respondWith(candidate("{}"));
    const service = new GeminiTranslationService({ apiKey: "", fetchImpl });

    await expect(service.translate(REQUEST)).rejects.toThrow(/GEMINI_API_KEY/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("no llama al proveedor cuando no hay nada que traducir", async () => {
    const fetchImpl = respondWith(candidate("{}"));
    const service = new GeminiTranslationService({ apiKey: "k", fetchImpl });

    await expect(
      service.translate({ ...REQUEST, title: "", content: "  " }),
    ).rejects.toThrow(/Nothing to translate/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("convierte un error HTTP en un error de dominio", async () => {
    const service = new GeminiTranslationService({
      apiKey: "k",
      fetchImpl: respondWith({}, false),
    });

    await expect(service.translate(REQUEST)).rejects.toThrow(/503/);
  });

  it("convierte una caída de red en un error de dominio", async () => {
    const service = new GeminiTranslationService({
      apiKey: "k",
      fetchImpl: vi
        .fn()
        .mockRejectedValue(
          new Error("ECONNREFUSED"),
        ) as unknown as typeof fetch,
    });

    await expect(service.translate(REQUEST)).rejects.toThrow(/unreachable/i);
  });

  /* Traducir no es escribir: se quiere la lectura más literal posible, no variedad. */
  it("pide temperatura cero y respuesta con esquema", async () => {
    const fetchImpl = respondWith(
      candidate(JSON.stringify({ title: "Natural whey", content: "x" })),
    );
    const service = new GeminiTranslationService({ apiKey: "k", fetchImpl });

    await service.translate(REQUEST);

    const [, init] = (fetchImpl as unknown as { mock: { calls: unknown[][] } })
      .mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));

    expect(body.generationConfig.temperature).toBe(0);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema.required).toEqual([
      "title",
      "content",
    ]);
  });
});

/**
 * La primera corrida real contra la base devolvió el texto con cero saltos de línea donde el
 * original tenía cuatro: título pegado al primer párrafo, la publicación entera vuelta un muro.
 * Estas pruebas son la red que impide que eso se escriba en silencio.
 */
describe("GeminiTranslationService y la estructura del texto", () => {
  const conSaltos = {
    ...REQUEST,
    content: "Título\nPrimer párrafo.\n\nSegundo párrafo.\nCierre.",
  };

  it("rechaza una traducción que aplastó los saltos de línea", async () => {
    const service = new GeminiTranslationService({
      apiKey: "k",
      fetchImpl: respondWith(
        candidate(
          JSON.stringify({
            title: "Natural whey",
            content: "TitleFirst paragraph.Second paragraph.Closing.",
          }),
        ),
      ),
    });

    await expect(service.translate(conSaltos)).rejects.toThrow(
      /collapsed the layout/i,
    );
  });

  it("acepta la traducción que los conserva", async () => {
    const service = new GeminiTranslationService({
      apiKey: "k",
      fetchImpl: respondWith(
        candidate(
          JSON.stringify({
            title: "Natural whey",
            content: "Title\nFirst paragraph.\n\nSecond paragraph.\nClosing.",
          }),
        ),
      ),
    });

    await expect(service.translate(conSaltos)).resolves.toMatchObject({
      content: "Title\nFirst paragraph.\n\nSecond paragraph.\nClosing.",
    });
  });

  /* Una traducción legítima puede unir dos líneas muy cortas; lo que no puede es perder la mitad. */
  it("tolera perder alguno, no la mayoría", async () => {
    const service = new GeminiTranslationService({
      apiKey: "k",
      fetchImpl: respondWith(
        candidate(
          JSON.stringify({
            title: "Natural whey",
            content: "Title\nFirst paragraph.\n\nSecond paragraph. Closing.",
          }),
        ),
      ),
    });

    await expect(service.translate(conSaltos)).resolves.toBeTruthy();
  });

  it("no exige saltos cuando el original no los tenía", async () => {
    const service = new GeminiTranslationService({
      apiKey: "k",
      fetchImpl: respondWith(
        candidate(
          JSON.stringify({ title: "Natural whey", content: "One line only." }),
        ),
      ),
    });

    await expect(
      service.translate({ ...REQUEST, content: "Una sola línea." }),
    ).resolves.toBeTruthy();
  });
});

/**
 * En la corrida real de las 23 publicaciones, una volvió sin traducir: Gemini devolvió
 * "¿Por Qué Comer Despacio es la Clave para Bajar de Peso?" tal cual. Como el slug sale del título
 * traducido, la fila inglesa acabó con una URL española y un `-1` pegado que no significa nada.
 */
describe("GeminiTranslationService cuando el modelo no traduce", () => {
  const original = {
    ...REQUEST,
    title: "¿Por Qué Comer Despacio es la Clave para Bajar de Peso?",
    content: "Comer despacio ayuda a tu digestión.",
  };

  it("rechaza el original devuelto sin tocar", async () => {
    const service = new GeminiTranslationService({
      apiKey: "k",
      fetchImpl: respondWith(
        candidate(
          JSON.stringify({
            title: original.title,
            content: original.content,
          }),
        ),
      ),
    });

    await expect(service.translate(original)).rejects.toThrow(/unchanged/i);
  });

  /* Un título puede legítimamente no cambiar —«Kombucha», «Hazlo Sano»—; lo que no pasa entre dos
     idiomas es que además el cuerpo entero coincida carácter por carácter. */
  it("acepta un título que no cambia si el cuerpo sí", async () => {
    const service = new GeminiTranslationService({
      apiKey: "k",
      fetchImpl: respondWith(
        candidate(
          JSON.stringify({
            title: "Kombucha",
            content: "Fermented tea from the house.",
          }),
        ),
      ),
    });

    await expect(
      service.translate({
        ...REQUEST,
        title: "Kombucha",
        content: "Té fermentado de la casa.",
      }),
    ).resolves.toMatchObject({ title: "Kombucha" });
  });
});
