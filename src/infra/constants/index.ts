export const SIGNIN_PATH = "/auth/signin";
export const PAGINATION_INIT_PAGE =
  Number(process.env.NEXT_PUBLIC_PAGINATION_INIT_PAGE) || 1;
export const PAGINATION_PAGE_SIZE =
  Number(process.env.NEXT_PUBLIC_PAGINATION_PAGE_SIZE) || 4;
export const COMMENTS_PAGE_SIZE =
  Number(process.env.NEXT_PUBLIC_COMMENTS_PAGE_SIZE) || 10;
export const CANONICAL_URL =
  process.env.NEXT_PUBLIC_CANONICAL_URL || "https://hazlosano.com";
export const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://hazlosano.com";
export const POST_CONTENT_MAX_LENGTH =
  process.env.NEXT_POST_CONTENT_MAX_LENGTH || 2500;
export const PUBLIC_BRAND_NAME =
  process.env.NEXT_PUBLIC_BRAND_NAME || "Hazlo Sano";
/**
 * La imagen que se anuncia al compartir cuando la página no tiene una propia.
 *
 * Relativa a propósito: `metadataBase` la resuelve contra el dominio que toque, así que en local
 * apunta a local y en producción a producción. Antes había dos formas escritas a mano —el dominio
 * completo repetido en cuatro archivos y un `/og-image.jpg` que **no existe** en `public/`—, y la
 * segunda hacía que la paginación del inicio compartiera una imagen 404.
 */
export const DEFAULT_SHARE_IMAGE = "/logo.webp";
/** Todo lo que se vende en el sitio está en pesos mexicanos. */
export const SITE_CURRENCY = "MXN";
/**
 * Los perfiles públicos de la marca, para el `sameAs` de la organización.
 *
 * Es lo que le dice a un buscador —y a un asistente— que la cuenta de TikTok, la de Facebook y
 * este dominio son la misma Hazlo Sano. Los mismos enlaces están escritos en el pie con su icono;
 * unificarlos es un pendiente aparte, no de este slice.
 */
export const BRAND_SOCIAL_URLS: readonly string[] = [
  "https://www.tiktok.com/@hazlosano",
  "https://fb.com/hazlo.sano.comunidad",
  "https://t.me/HazloSanoBot",
];
