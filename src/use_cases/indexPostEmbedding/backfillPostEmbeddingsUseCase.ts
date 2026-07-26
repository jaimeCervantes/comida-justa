import type IndexPostEmbeddingUseCase from "./indexPostEmbeddingUseCase";
import type { IndexSkipReason } from "./indexPostEmbeddingUseCase";
import type IPostEmbeddingRepository from "./ports/IPostEmbeddingRepository";

export type BackfillSummary = {
  attempted: number;
  indexed: number;
  failed: number;
  reasons: Partial<Record<IndexSkipReason, number>>;
};

const DEFAULT_LIMIT = 200;

/**
 * Reintenta lo que quedó pendiente de indexar: publicaciones anteriores al slice 4 y las que se
 * crearon mientras el proveedor estaba caído.
 *
 * Procesa **en serie a propósito**. Son decenas de filas, no miles, y el proveedor tiene límite
 * de peticiones por minuto: paralelizar cambiaría un backfill lento por uno que se rechaza a sí
 * mismo. Un fallo individual no aborta la corrida — esa fila simplemente sigue pendiente.
 */
export default class BackfillPostEmbeddingsUseCase {
  constructor(
    private readonly postEmbeddingRepository: IPostEmbeddingRepository,
    private readonly indexPostEmbedding: IndexPostEmbeddingUseCase,
  ) {}

  async execute(limit: number = DEFAULT_LIMIT): Promise<BackfillSummary> {
    const pending = await this.postEmbeddingRepository.findPendingIndexing(limit);

    const summary: BackfillSummary = {
      attempted: pending.length,
      indexed: 0,
      failed: 0,
      reasons: {},
    };

    for (const ref of pending) {
      const result = await this.indexPostEmbedding.execute(ref);

      if (result.indexed) {
        summary.indexed++;
        continue;
      }

      summary.failed++;
      summary.reasons[result.reason] = (summary.reasons[result.reason] ?? 0) + 1;
    }

    return summary;
  }
}
