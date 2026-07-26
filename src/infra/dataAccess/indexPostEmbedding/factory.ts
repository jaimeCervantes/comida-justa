import { createEmbeddingService } from "~/infra/services/factory";
import BackfillPostEmbeddingsUseCase from "~/use_cases/indexPostEmbedding/backfillPostEmbeddingsUseCase";
import IndexPostEmbeddingUseCase from "~/use_cases/indexPostEmbedding/indexPostEmbeddingUseCase";
import type IPostEmbeddingRepository from "~/use_cases/indexPostEmbedding/ports/IPostEmbeddingRepository";
import PostgresPostEmbeddingRepository from "./PostgresPostEmbeddingRepository";

let repository: IPostEmbeddingRepository | null = null;

export function createPostEmbeddingRepository(): IPostEmbeddingRepository {
  if (repository) return repository;
  repository = new PostgresPostEmbeddingRepository();
  return repository;
}

/** Raíz de composición compartida por la Server Action de publicar y el script de backfill. */
export function createIndexPostEmbeddingUseCase(): IndexPostEmbeddingUseCase {
  return new IndexPostEmbeddingUseCase(
    createPostEmbeddingRepository(),
    createEmbeddingService(),
  );
}

export function createBackfillPostEmbeddingsUseCase(): BackfillPostEmbeddingsUseCase {
  return new BackfillPostEmbeddingsUseCase(
    createPostEmbeddingRepository(),
    createIndexPostEmbeddingUseCase(),
  );
}
