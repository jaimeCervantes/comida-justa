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
