import type IContentModerationService from "~/use_cases/common/ports/IContentModerationService";
import type IEmbeddingService from "~/use_cases/common/ports/IEmbeddingService";
import type ITranslationService from "~/use_cases/common/ports/ITranslationService";
import GeminiContentModerationService from "./GeminiContentModerationService";
import GeminiEmbeddingService from "./GeminiEmbeddingService";
import GeminiTranslationService from "./GeminiTranslationService";

let instance: IEmbeddingService | null = null;
let translator: ITranslationService | null = null;
let moderator: IContentModerationService | null = null;

/**
 * El proveedor de embeddings del sitio. Se lee `GEMINI_API_KEY` aquí y no en el constructor para
 * que el servicio siga siendo testeable sin variables de entorno.
 */
export function createEmbeddingService(): IEmbeddingService {
  if (instance) return instance;
  instance = new GeminiEmbeddingService({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });
  return instance;
}

/** El traductor del sitio. Comparte clave con los embeddings; el modelo y el endpoint son otros. */
export function createTranslationService(): ITranslationService {
  if (translator) return translator;
  translator = new GeminiTranslationService({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });
  return translator;
}

/** El clasificador que decide si una publicación pertenece al catálogo. Misma clave que los demás. */
export function createContentModerationService(): IContentModerationService {
  if (moderator) return moderator;
  moderator = new GeminiContentModerationService({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });
  return moderator;
}
