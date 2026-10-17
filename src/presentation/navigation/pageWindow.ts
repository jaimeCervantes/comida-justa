/** Cuántos números de página se enseñan a la vez. */
export const PAGE_WINDOW_SIZE = 5;

/**
 * Los números de página a la vista: hasta cinco, centrados en la actual y sin pasarse de los
 * extremos. Con una sola página no hay ninguno, porque no hay a dónde ir.
 *
 * La comparten la paginación por enlaces (`Pagination`) y la de botones (`PageButtons`), que
 * difieren en cómo se cambia de página y no en qué números se ven.
 */
export function pageWindow(
  currentPage: number,
  totalPages: number,
  size: number = PAGE_WINDOW_SIZE,
): number[] {
  if (totalPages <= 1) return [];

  const half = Math.floor(size / 2);
  let start = Math.max(1, currentPage - half);
  const end = Math.min(totalPages, start + size - 1);
  if (end - start < size - 1) start = Math.max(1, end - size + 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
