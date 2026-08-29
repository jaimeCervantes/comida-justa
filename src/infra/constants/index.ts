export const SIGNIN_PATH = "/auth/signin";
export const PAGINATION_INIT_PAGE =
  Number(process.env.NEXT_PUBLIC_PAGINATION_INIT_PAGE) || 1;
export const PAGINATION_PAGE_SIZE =
  Number(process.env.NEXT_PUBLIC_PAGINATION_PAGE_SIZE) || 4;
export const COMMENTS_PAGE_SIZE =
  Number(process.env.NEXT_PUBLIC_COMMENTS_PAGE_SIZE) || 10;
/** Cuántas publicaciones parecidas acompañan al detalle. Cuatro llenan la columna sin empujar los comentarios fuera de la pantalla. */
export const RELATED_POSTS_LIMIT =
  Number(process.env.NEXT_PUBLIC_RELATED_POSTS_LIMIT) || 4;
export const CANONICAL_URL =
  process.env.NEXT_PUBLIC_CANONICAL_URL || "https://hazlosano.com";
export const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://hazlosano.com";
export const POST_CONTENT_MAX_LENGTH =
  process.env.NEXT_POST_CONTENT_MAX_LENGTH || 2500;
/**
 * Cuánto puede medir el título de una publicación.
 *
 * El 5.3 del canvas dibuja un contador «29/70», y 70 no es un número redondo elegido de oídas: de
 * los 59 títulos publicados, el más largo mide 61, la media 32 y el percentil 95 se queda en 57.
 * **Ninguno pasaría del tope**, así que no recorta nada de lo que ya existe y sí evita el título
 * que se corta con puntos suspensivos en la tarjeta del listado.
 *
 * Sin `process.env` a propósito: no hay ninguna razón para que este número cambie por entorno, y
 * una constante configurable es una constante que en CI vale otra cosa.
 */
export const POST_TITLE_MAX_LENGTH = 70;
/**
 * Cuánto puede medir un comentario.
 *
 * El número no es nuevo: `createDirectCommentTopost.feature` lo escribió el primer día —«a comment
 * that exceeds 500 characters»— y nadie lo hizo cumplir. Un comentario es una reacción, no una
 * publicación; para lo que no cabe en 500 caracteres está publicar.
 *
 * **Lo que lo vuelve necesario es dónde se comprueba.** `comments.content` es una columna `text`, y
 * la acción que escribe ahí es un endpoint HTTP público: sin tope en el servidor, no hay tope.
 *
 * Sin `process.env`, por el mismo motivo que el título: no hay razón para que cambie por entorno, y
 * una constante configurable es una constante que en CI vale otra cosa.
 */
export const COMMENT_MAX_LENGTH = 500;
/**
 * Cuántos comentarios puede escribir una persona por minuto.
 *
 * Es el único freno del sitio a un abuso a escala: con una sesión válida y un bucle, la ficha de un
 * competidor se llena de miles de comentarios en un minuto, y borrarlos después es trabajo manual
 * sobre datos que ya vio todo el mundo. Cinco es generoso para quien escribe de verdad —son doce
 * segundos por comentario, contando lo que se tarda en pensarlo— y ridículo para un script.
 *
 * **No sustituye a la moderación**, que juzga *qué* se dice; esto sólo acota *cuánto*.
 */
export const COMMENT_RATE_LIMIT_PER_MINUTE = 5;
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
