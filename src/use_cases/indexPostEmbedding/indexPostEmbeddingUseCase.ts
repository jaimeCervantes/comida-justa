import {
  buildEmbeddingText,
  hasEmbeddableText,
  hasExpectedDimensions,
} from "~/domain/entities/post/embedding";
import type IEmbeddingService from "~/use_cases/common/ports/IEmbeddingService";
import type IPostEmbeddingRepository from "./ports/IPostEmbeddingRepository";
import type { TranslationRef } from "./ports/IPostEmbeddingRepository";

export type IndexSkipReason =
  | "not-found"
  | "empty-text"
  | "unexpected-dimensions"
  | "provider-error";

export type IndexPostEmbeddingResult =
  | { indexed: true }
  | { indexed: false; reason: IndexSkipReason; error?: unknown };

/**
 * Le da al chatbot lo único que le falta para ver una publicación del sitio: su vector.
 *
 * **Nunca lanza.** Corre fuera del camino crítico de publicar (`after()` en la Server Action) y
 * también en el backfill, y en los dos casos un fallo del proveedor solo significa "sigue
 * pendiente": la publicación ya existe y se reintenta en la siguiente corrida. Por eso devuelve
 * un resultado con motivo en vez de propagar el error.
 */
export default class IndexPostEmbeddingUseCase {
  constructor(
    private readonly postEmbeddingRepository: IPostEmbeddingRepository,
    private readonly embeddingService: IEmbeddingService,
  ) {}

  async execute(ref: TranslationRef): Promise<IndexPostEmbeddingResult> {
    let source: Awaited<
      ReturnType<IPostEmbeddingRepository["findEmbeddingSource"]>
    >;
    try {
      source = await this.postEmbeddingRepository.findEmbeddingSource(ref);
    } catch (error) {
      return { indexed: false, reason: "provider-error", error };
    }

    if (!source) {
      return { indexed: false, reason: "not-found" };
    }

    if (!hasEmbeddableText(source)) {
      return { indexed: false, reason: "empty-text" };
    }

    let embedding: number[];
    try {
      embedding = await this.embeddingService.generateEmbedding(
        buildEmbeddingText(source),
      );
    } catch (error) {
      return { indexed: false, reason: "provider-error", error };
    }

    // La columna es `vector(768)`: guardar otro tamaño reventaría el INSERT, no el modelo.
    if (!hasExpectedDimensions(embedding)) {
      return { indexed: false, reason: "unexpected-dimensions" };
    }

    try {
      await this.postEmbeddingRepository.saveEmbedding(ref, embedding);
    } catch (error) {
      return { indexed: false, reason: "provider-error", error };
    }

    return { indexed: true };
  }
}
