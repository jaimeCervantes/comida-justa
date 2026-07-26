/** Conteo crudo de traducciones con y sin vector, tal como sale del almacenamiento. */
export type IndexingCounts = {
  indexed: number;
  pending: number;
};

export type IndexingReport = {
  indexed: number;
  pending: number;
  total: number;
  /** Proporción indexada, entre 0 y 1. `1` cuando no hay nada que indexar. */
  coverage: number;
};

/**
 * Estado de indexación del catálogo para el panel interno.
 *
 * Una publicación sin vector es invisible para el chatbot aunque se vea perfecta en el sitio: ese
 * hueco silencioso es justo lo que el reporte tiene que hacer visible. Con cero publicaciones la
 * cobertura es `1` (nada pendiente), no `0`: un catálogo vacío no está "sin indexar".
 */
export function buildIndexingReport(counts: IndexingCounts): IndexingReport {
  const indexed = Math.max(0, counts.indexed);
  const pending = Math.max(0, counts.pending);
  const total = indexed + pending;

  return {
    indexed,
    pending,
    total,
    coverage: total > 0 ? indexed / total : 1,
  };
}
