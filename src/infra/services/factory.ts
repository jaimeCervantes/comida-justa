import type IEmbeddingService from "~/use_cases/common/ports/IEmbeddingService";
import GeminiEmbeddingService from "./GeminiEmbeddingService";

let instance: IEmbeddingService | null = null;

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
