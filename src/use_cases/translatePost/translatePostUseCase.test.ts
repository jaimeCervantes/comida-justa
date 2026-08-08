import { beforeEach, describe, expect, it, vi } from "vitest";
import TranslationProviderError from "~/domain/errors/TranslationProviderError";
import type ITranslationService from "~/use_cases/common/ports/ITranslationService";
import type IPostTranslationRepository from "./ports/IPostTranslationRepository";
import TranslatePostUseCase from "./translatePostUseCase";

/**
 * Cubre los escenarios de `@slice-3` en `src/e2e/i18n/i18n.feature`.
 *
 * Datos reales: "Suero natural" es una de las 24 publicaciones que hoy existen en
 * `post_translations`, todas en español.
 */
const SUERO = {
  locale: "es",
  title: "Suero natural",
  slug: "suero-natural",
  content: "Bebida fermentada de la casa. #saludable",
};

function makeRepository(
  overrides: Partial<IPostTranslationRepository> = {},
): IPostTranslationRepository {
  return {
    findTranslation: vi.fn().mockResolvedValue(SUERO),
    hasTranslation: vi.fn().mockResolvedValue(false),
    createUniqueSlug: vi.fn(async (slug: string) => slug),
    saveTranslation: vi.fn().mockResolvedValue(true),
    findPostsMissingLocale: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function makeTranslator(
  overrides: Partial<ITranslationService> = {},
): ITranslationService {
  return {
    translate: vi.fn().mockResolvedValue({
      title: "Natural whey",
      content: "House fermented drink. #healthy",
    }),
    ...overrides,
  };
}

const input = {
  postId: "post-1",
  sourceLocale: "es",
  targetLocale: "en",
};

describe("TranslatePostUseCase", () => {
  let repository: IPostTranslationRepository;
  let translator: ITranslationService;

  beforeEach(() => {
    repository = makeRepository();
    translator = makeTranslator();
  });

  it("guarda la traducción con su propio slug", async () => {
    const result = await new TranslatePostUseCase(
      repository,
      translator,
    ).execute(input);

    expect(result).toEqual({ translated: true, slug: "natural-whey" });
    expect(repository.saveTranslation).toHaveBeenCalledWith({
      postId: "post-1",
      locale: "en",
      title: "Natural whey",
      content: "House fermented drink. #healthy",
      slug: "natural-whey",
    });
  });

  it("manda el título y el cuerpo juntos, para no perder el contexto", async () => {
    await new TranslatePostUseCase(repository, translator).execute(input);

    expect(translator.translate).toHaveBeenCalledWith({
      title: "Suero natural",
      content: "Bebida fermentada de la casa. #saludable",
      sourceLocale: "es",
      targetLocale: "en",
    });
  });

  /**
   * La idempotencia no es un lujo: `post_translations` **no tiene** `UNIQUE(post_id, locale)`, así
   * que la base no impediría una segunda fila. Sin esto, correr el backfill dos veces duplicaría
   * las 24 publicaciones.
   */
  it("no traduce lo que ya está traducido", async () => {
    repository = makeRepository({
      hasTranslation: vi.fn().mockResolvedValue(true),
    });

    const result = await new TranslatePostUseCase(
      repository,
      translator,
    ).execute(input);

    expect(result).toEqual({ translated: false, reason: "already-exists" });
    expect(translator.translate).not.toHaveBeenCalled();
  });

  /* Dos pestañas, o el backfill corriendo mientras alguien publica: la fila puede aparecer entre
     la comprobación y el insert. Sin índice único en la base, la carrera es real. */
  it("aguanta que alguien escriba la fila mientras traduce", async () => {
    repository = makeRepository({
      saveTranslation: vi.fn().mockResolvedValue(false),
    });

    const result = await new TranslatePostUseCase(
      repository,
      translator,
    ).execute(input);

    expect(result).toEqual({ translated: false, reason: "already-exists" });
  });

  /**
   * Publicar no puede depender de que Gemini conteste. El caso de uso corre dentro de `after()`,
   * cuando la respuesta ya salió: un `throw` aquí no lo vería nadie y sí ensuciaría los logs.
   */
  it("no lanza cuando el proveedor falla", async () => {
    translator = makeTranslator({
      translate: vi
        .fn()
        .mockRejectedValue(new TranslationProviderError("Gemini is down")),
    });

    const result = await new TranslatePostUseCase(
      repository,
      translator,
    ).execute(input);

    expect(result).toMatchObject({
      translated: false,
      reason: "provider-failed",
    });
    expect(repository.saveTranslation).not.toHaveBeenCalled();
  });

  it("no inventa nada cuando falta el original", async () => {
    repository = makeRepository({
      findTranslation: vi.fn().mockResolvedValue(null),
    });

    const result = await new TranslatePostUseCase(
      repository,
      translator,
    ).execute(input);

    expect(result).toEqual({ translated: false, reason: "source-missing" });
    expect(translator.translate).not.toHaveBeenCalled();
  });

  /* El slug sale del título traducido, no del español: es lo que hace que `/natural-whey` exista
     y que cambiar de idioma en la ficha lleve a la misma publicación. */
  it("desambigua el slug cuando ya está tomado", async () => {
    repository = makeRepository({
      createUniqueSlug: vi.fn().mockResolvedValue("natural-whey-1"),
    });

    const result = await new TranslatePostUseCase(
      repository,
      translator,
    ).execute(input);

    expect(result).toEqual({ translated: true, slug: "natural-whey-1" });
  });
});

/**
 * Quién falló, el proveedor o la base.
 *
 * El `try` envolvía la traducción **y** las dos escrituras, así que un error de Postgres salía
 * como `provider-failed` y el aviso decía «queda pendiente, ya lo recogerá el backfill». Es la
 * peor forma de equivocarse: manda a mirar el estado de Gemini cuando el problema está en la
 * conexión, y promete un backfill que va a fallar exactamente igual. Se vio de verdad en la corrida
 * e2e del 2026-08-07:
 *
 *   [translations] post 80dea1e5-… queda pendiente en en Error: Failed query: …
 *
 * Y las dos lecturas de arriba estaban fuera de todo `try`, así que una base caída hacía **lanzar**
 * a un caso de uso cuya primera línea de documentación dice que nunca lanza.
 */
describe("TranslatePostUseCase y de quién es el fallo", () => {
  const dbDown = () => new Error("Failed query: select ...");

  it("un fallo del proveedor es del proveedor", async () => {
    const result = await new TranslatePostUseCase(
      makeRepository(),
      makeTranslator({
        translate: vi
          .fn()
          .mockRejectedValue(new TranslationProviderError("Gemini is down")),
      }),
    ).execute(input);

    expect(result).toMatchObject({
      translated: false,
      reason: "provider-failed",
    });
  });

  /* Lo que Gemini contestó es correcto y ya está pagado; lo que falló es guardarlo. Volver a
     traducir no arregla nada. */
  it.each([
    [
      "createUniqueSlug",
      { createUniqueSlug: vi.fn().mockRejectedValue(dbDown()) },
    ],
    [
      "saveTranslation",
      { saveTranslation: vi.fn().mockRejectedValue(dbDown()) },
    ],
  ])(
    "un fallo al guardar (%s) es de la base, no de Gemini",
    async (_, override) => {
      const result = await new TranslatePostUseCase(
        makeRepository(override),
        makeTranslator(),
      ).execute(input);

      expect(result).toMatchObject({
        translated: false,
        reason: "storage-failed",
      });
    },
  );

  /* «Nunca lanza» tiene que valer también cuando la base no contesta a la primera pregunta. */
  it.each([
    ["hasTranslation", { hasTranslation: vi.fn().mockRejectedValue(dbDown()) }],
    [
      "findTranslation",
      { findTranslation: vi.fn().mockRejectedValue(dbDown()) },
    ],
  ])(
    "tampoco lanza si la base cae antes de traducir (%s)",
    async (_, override) => {
      const translator = makeTranslator();

      const result = await new TranslatePostUseCase(
        makeRepository(override),
        translator,
      ).execute(input);

      expect(result).toMatchObject({
        translated: false,
        reason: "storage-failed",
      });
      /* Y no se le paga a Gemini una traducción que no se va a poder guardar. */
      expect(translator.translate).not.toHaveBeenCalled();
    },
  );

  it("el error original viaja en el resultado, sea de quien sea", async () => {
    const causa = dbDown();

    const result = await new TranslatePostUseCase(
      makeRepository({ saveTranslation: vi.fn().mockRejectedValue(causa) }),
      makeTranslator(),
    ).execute(input);

    expect(result).toMatchObject({ translated: false, error: causa });
  });
});
