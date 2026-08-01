import type { Metadata } from "next";

/**
 * Para las páginas que existen pero no son contenido: sesión, publicación, administración y
 * resultados de búsqueda.
 *
 * Los resultados de búsqueda entran aquí no por privacidad sino por volumen: indexarlos genera
 * una página por cada término que alguien teclee, casi idénticas entre sí, compitiendo contra las
 * publicaciones que sí importan.
 *
 * `follow` se queda en `true`: que no se indexe la página no significa que sus enlaces no valgan.
 */
export const NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: true },
};
