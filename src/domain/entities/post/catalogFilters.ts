import { normalizeBrand } from "./brand";

/**
 * Los filtros del catálogo que viajan en la dirección, además de `promocion` (`promotion.ts`) y del
 * pilar. Viven en la dirección y no en un estado de la pantalla para que un filtro se comparta y
 * vuelva con el botón de atrás; son los que usan los slides del carrusel de ofertas.
 */
export const BRAND_QUERY_PARAM = "marca";
export const STORE_QUERY_PARAM = "tienda";

/** El handle de una tienda: minúsculas, números y guiones, como `sellers.slug`. */
const STORE_HANDLE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** `?marca=` como se guarda una marca; vacía o ausente, sin filtro. */
export function parseBrandFilter(value: unknown): string | null {
  return normalizeBrand(value);
}

/** `?tienda=`, solo si tiene forma de handle; cualquier otra cosa es no filtrar, no un error. */
export function parseStoreFilter(value: unknown): string | null {
  return typeof value === "string" && STORE_HANDLE.test(value) ? value : null;
}
