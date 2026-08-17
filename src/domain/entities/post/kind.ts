/**
 * Qué es una publicación. Eje ortogonal a `origin` (de dónde/quién viene): un "producto de Hazlo
 * Sano" es `kind = "producto"` con un `origin` de tipo `hazlo_sano_*`.
 *
 * `posts.kind` es `text` **sin `CHECK`** en la base, así que esta lista es la única autoridad sobre
 * qué tipos existen. Sumar uno no cuesta migración; lo que cuesta es el dato que el tipo necesita
 * —`evento` trajo `starts_at`— y su regla en `PostValidator.validateKindAndOrigin`.
 */
export const POST_KINDS = [
  /** Contenido o aviso: no se vende ni ocurre. Es el que cae por omisión. */
  "anuncio",
  /** Algo que entregas. Exige precio > 0 y procedencia. */
  "producto",
  /**
   * Algo que **ocurre**: una rodada, un taller, una meditación.
   *
   * Exige fecha, el precio es opcional —los eventos gratis son lo normal— y **no se le pregunta la
   * procedencia**, que responde "¿lo haces o lo revendes?" y solo significa algo en mercancía.
   */
  "evento",
  /**
   * Algo que **haces**: una consulta, un masaje, una sesión con el quiropráctico.
   *
   * Exige precio y **duración** —que es lo que definirá el hueco cuando llegue la agenda— y, como
   * el evento, **no se le pregunta la procedencia**: un masaje siempre lo das tú.
   */
  "servicio",
] as const;

export type PostKind = (typeof POST_KINDS)[number];

export const DEFAULT_POST_KIND: PostKind = "anuncio";

/** Nombrado para que quien filtre eventos no escriba el literal en una consulta. */
export const EVENT_KIND: PostKind = "evento";

export const SERVICE_KIND: PostKind = "servicio";

/**
 * Lo que se cobra y se pide: un producto y un servicio.
 *
 * Existe como lista y no como comparación suelta porque la pregunta "¿esto se vende?" se hace en
 * media docena de sitios —el carrito, el botón de WhatsApp, la insignia de agotado, la distancia a
 * la tienda— y hasta ahora cada uno comparaba contra `"producto"` a mano. Sumar `servicio` habría
 * sido encontrarlos todos; con esto, es una línea.
 *
 * **Un evento NO está aquí**: apuntarse a una rodada no es comprarla, y meterlo lo metería en el
 * carrito. Esa es otra decisión y otro slice.
 */
export const SELLABLE_KINDS: readonly PostKind[] = ["producto", "servicio"];

export function isValidKind(value: unknown): value is PostKind {
  return (
    typeof value === "string" &&
    (POST_KINDS as readonly string[]).includes(value)
  );
}
