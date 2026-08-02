import { isSoldOut } from "./availability";

export interface RelatedCandidate {
  id: string;
  kind?: string | null;
  isAvailable?: boolean | null;
}

/**
 * Qué publicaciones acompañan a la que se está leyendo.
 *
 * El orden lo decide la base por parecido semántico (`embedding <=>`), así que aquí solo se aplica
 * lo que el orden no sabe:
 *
 * - **La propia publicación no se recomienda a sí misma.** La consulta la excluye por `id`, pero
 *   dos traducciones del mismo texto pueden colarse; se filtra igual.
 * - **Lo agotado no se ofrece.** Es la misma regla que apaga el botón de WhatsApp: mandar a alguien
 *   a algo que el vendedor ya marcó como agotado empieza la visita con una decepción. Un anuncio
 *   nunca se agota, así que solo afecta a los productos.
 *
 * **No hay umbral de parecido a propósito.** Con estos vectores dos publicaciones sin nada que ver
 * puntúan ~0.68, así que cualquier corte o no filtra nada o filtra por una cifra inventada; lo que
 * lleva la señal es el orden, no el número.
 */
export function pickRelated<T extends RelatedCandidate>(
  candidates: readonly T[],
  currentId: string,
  limit: number,
): T[] {
  if (limit <= 0) return [];

  return candidates
    .filter((candidate) => candidate.id !== currentId && !isSoldOut(candidate))
    .slice(0, limit);
}
