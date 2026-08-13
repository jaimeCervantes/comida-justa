import type { PostMediaFile } from "./types";

/**
 * Cuántos archivos caben en una publicación.
 *
 * Diez, el mismo tope que Instagram y Facebook, que es con lo que la comunidad compara. Vive aquí y
 * no en `src/infra/constants/` **porque es una regla de negocio y no una preferencia de despliegue**:
 * las constantes de ahí se leen de `process.env` y CI corre sin ningún `.env`, así que un tope
 * env-driven valdría una cosa en local y otra en GitHub, y la prueba que lo comprobara sería un
 * fantasma distinto en cada máquina.
 */
export const MAX_POST_MEDIA_FILES = 10;

/**
 * La categoría de un archivo a partir de su MIME: `image/jpeg` → `image`.
 *
 * `post_media.type` guarda la categoría, no el MIME —las 23 filas de la base son `image` o `video`—
 * porque es lo que despacha `MediaContent` al pintar. La conversión estaba suelta como un
 * `.split("/")[0]` dentro de la Server Action, donde ninguna prueba la alcanzaba.
 */
export function mediaTypeFromMime(mime: string | undefined | null): string {
  const category = String(mime ?? "").split("/")[0];

  return category || "image";
}

/** Lo que el navegador serializa en el campo oculto del formulario tras subir cada archivo. */
interface UploadedMediaPayload {
  url?: unknown;
  type?: unknown;
  alt?: unknown;
  width?: unknown;
  height?: unknown;
}

/** Las dimensiones solo viajan si son números utilizables; cualquier otra cosa es «no lo sabemos». */
function toDimension(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

/**
 * De lo que llega en el campo oculto `media` a las filas que se guardarán en `post_media`.
 *
 * Acepta **las dos formas**: el array que manda el formulario desde esta entrega, y el objeto único
 * que mandaba antes. La segunda no es cortesía con el pasado sino con el presente: mientras haya una
 * pestaña abierta con el formulario anterior, su envío sigue llegando a esta función.
 *
 * Nada de lo que entra aquí es de fiar —es texto de un campo del navegador—, así que un JSON roto no
 * lanza: devuelve vacío y deja que quien llama decida. Publicar exige al menos un archivo, y esa
 * regla vive en la Server Action, que es quien puede contestarle a la persona.
 *
 * El orden del array **es** el orden de la publicación: quien lo recibe lo vuelca a `sort_order` por
 * índice, y el 0 es la portada que ya piden el carrito, los pedidos y el bot.
 */
export function parsePostMediaPayload(
  raw: string | null | undefined,
  options: { alt?: string } = {},
): PostMediaFile[] {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const items: UploadedMediaPayload[] = Array.isArray(parsed)
    ? parsed
    : [parsed as UploadedMediaPayload];

  return items
    .filter(
      (item): item is UploadedMediaPayload =>
        typeof item?.url === "string" && item.url.length > 0,
    )
    .slice(0, MAX_POST_MEDIA_FILES)
    .map((item) => ({
      url: item.url as string,
      type: mediaTypeFromMime(item.type as string),
      /* El `alt` de la columna no tiene idioma —hay una fila por archivo, no por traducción—, así
         que siempre fue el título de quien publica. Quien pinta lo reemplaza por el de la traducción
         activa (ver `PostDetail`); esto es solo lo que queda escrito en la base. */
      alt: options.alt ?? (typeof item.alt === "string" ? item.alt : undefined),
      width: toDimension(item.width),
      height: toDimension(item.height),
    }));
}
