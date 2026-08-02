import { withoutHashtags } from "../entities/post/hashtags";

/** Lo que cabe en un resultado de búsqueda antes de que lo recorten con puntos suspensivos. */
export const META_DESCRIPTION_MAX_LENGTH = 155;

/**
 * Convierte el contenido de una publicación en una descripción para buscadores y para la vista
 * previa de WhatsApp.
 *
 * Se corta **en la última palabra completa** y no a media palabra: la descripción la lee una
 * persona, y "Nopal, apio, piña y perej…" se ve como un error, no como un resumen.
 *
 * Los saltos de línea y los espacios repetidos se colapsan porque el contenido se escribe en un
 * textarea y llega con la forma que le dio quien publicó, no con la que necesita una meta.
 *
 * **La ristra de hashtags del final se cae aquí**, no en cada llamador. Las publicaciones nacieron
 * como reels y cierran con "#BuenSueño #DormirBien #SaludJusta…": en la página se quedan, pero en
 * una descripción son relleno que desplaza a las palabras que sí dicen de qué va.
 */
/** Dónde termina la última palabra completa; el largo entero si no hay ningún espacio. */
function boundaryBefore(cut: string): number {
  const lastSpace = cut.lastIndexOf(" ");

  return lastSpace > 0 ? lastSpace : cut.length;
}

export function buildMetaDescription(
  content: string | null | undefined,
  maxLength: number = META_DESCRIPTION_MAX_LENGTH,
): string {
  const flat = withoutHashtags(content).replace(/\s+/g, " ").trim();

  if (flat.length <= maxLength) return flat;

  const cut = flat.slice(0, maxLength);

  // Si el corte cae justo donde terminaba una palabra, ya está en un límite: retroceder al
  // espacio anterior tiraría una palabra entera que sí cabía.
  const truncated =
    flat[maxLength] === " " ? cut : cut.slice(0, boundaryBefore(cut));

  // Sin puntuación colgando antes de los puntos suspensivos.
  return `${truncated.replace(/[.,;:—-]+$/, "")}…`;
}
