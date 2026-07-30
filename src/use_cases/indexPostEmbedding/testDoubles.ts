import type { PostEmbeddingSource } from "~/domain/entities/post/embedding";
import { EMBEDDING_DIMENSIONS } from "~/domain/entities/post/embedding";
import type IEmbeddingService from "~/use_cases/common/ports/IEmbeddingService";
import type IPostEmbeddingRepository from "./ports/IPostEmbeddingRepository";
import type { TranslationRef } from "./ports/IPostEmbeddingRepository";

export function aVector(
  fill: number = 0.1,
  size: number = EMBEDDING_DIMENSIONS,
): number[] {
  return new Array(size).fill(fill);
}

export const JUGO_VERDE: PostEmbeddingSource = {
  title: "Jugo Verde",
  category: "Alimentación",
  subCategory: "Jugos",
  content: "Espinaca, apio, pepino y limón. Sin azúcar añadida.",
  tags: ["jugo"],
  price: 40,
};

type FakeRepositoryOptions = {
  source?: PostEmbeddingSource | null;
  pending?: TranslationRef[];
  failOnSave?: Error;
  failOnRead?: Error;
};

export class FakePostEmbeddingRepository implements IPostEmbeddingRepository {
  readonly saved: Array<{ ref: TranslationRef; embedding: number[] }> = [];

  constructor(private readonly options: FakeRepositoryOptions = {}) {}

  async findEmbeddingSource(): Promise<PostEmbeddingSource | null> {
    if (this.options.failOnRead) throw this.options.failOnRead;
    return this.options.source === undefined ? JUGO_VERDE : this.options.source;
  }

  async saveEmbedding(ref: TranslationRef, embedding: number[]): Promise<void> {
    if (this.options.failOnSave) throw this.options.failOnSave;
    this.saved.push({ ref, embedding });
  }

  async findPendingIndexing(limit: number): Promise<TranslationRef[]> {
    return (this.options.pending ?? []).slice(0, limit);
  }
}

export class FakeEmbeddingService implements IEmbeddingService {
  readonly texts: string[] = [];

  constructor(
    private readonly outcome: { vector?: number[]; error?: Error } = {},
  ) {}

  async generateEmbedding(text: string): Promise<number[]> {
    this.texts.push(text);
    if (this.outcome.error) throw this.outcome.error;
    return this.outcome.vector ?? aVector();
  }
}
