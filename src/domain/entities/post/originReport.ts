import { POST_ORIGINS, type PostOrigin } from "./origin";

/** Conteo crudo por `origin` tal como sale del almacenamiento (`null` = sin especificar). */
export type OriginCount = {
  origin: string | null;
  count: number;
};

export type OriginReportRow = {
  origin: PostOrigin | null;
  count: number;
  /** Proporción sobre el total, entre 0 y 1. `0` cuando no hay productos. */
  share: number;
};

export type OriginReport = {
  rows: OriginReportRow[];
  total: number;
};

/**
 * Arma el reporte de productos por procedencia a partir de conteos crudos.
 *
 * Siempre lista **todos** los `origin` de la allowlist en su orden canónico —aunque tengan cero
 * productos— más una fila final para los que no lo tienen especificado. Así el reporte es estable
 * entre corridas (las filas no aparecen y desaparecen) y muestra los huecos, que es justo lo que
 * interesa ver. Los `origin` desconocidos (datos viejos fuera de la allowlist) se agrupan en la
 * fila de "sin especificar" en vez de romper el reporte.
 */
export function buildOriginReport(counts: OriginCount[]): OriginReport {
  const knownOrigins = POST_ORIGINS as readonly string[];
  const byOrigin = new Map<string | null, number>();

  for (const { origin, count } of counts) {
    const key = origin && knownOrigins.includes(origin) ? origin : null;
    byOrigin.set(key, (byOrigin.get(key) ?? 0) + count);
  }

  const total = [...byOrigin.values()].reduce((sum, count) => sum + count, 0);
  const toRow = (origin: PostOrigin | null): OriginReportRow => {
    const count = byOrigin.get(origin) ?? 0;
    return { origin, count, share: total > 0 ? count / total : 0 };
  };

  return {
    rows: [...POST_ORIGINS.map(toRow), toRow(null)],
    total,
  };
}
