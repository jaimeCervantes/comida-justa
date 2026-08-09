import type { Coordinates } from "~/domain/entities/seller/coordinates";

/** Lo que se pone cuando no sabemos dónde está quien mira: ninguna coordenada se llama así. */
const NOWHERE = "unknown";

/**
 * La identidad de un feed: desde dónde se midieron las distancias que llevan sus tarjetas.
 *
 * `PostsWithLoadMore` guarda en estado las páginas que va acumulando, y `useState` solo mira su
 * valor inicial. O sea que una revalidación del servidor le llega con `initialPosts` nuevos y los
 * **ignora**: eso es lo que dejaba el home enseñando las distancias de antes después de corregir la
 * ubicación, mientras el chip de arriba ya decía "hace unos segundos".
 *
 * Cuando lo que cambió es desde dónde se mide, no hay nada que salvar: la primera página y las que
 * trajo el scroll están mal por igual. Por eso esto se usa como `key` y no como un `useEffect` que
 * sincroniza: es la forma que React tiene de decir "esta ya no es la misma lista", y empezar de
 * nuevo es exactamente la respuesta correcta.
 *
 * Y por eso depende de las coordenadas y no de la fecha del dato: con la misma ubicación el valor
 * no cambia, así que una revalidación cualquiera —alguien marcando agotado su producto— no le tira
 * al lector las páginas que llevaba cargadas.
 */
export function measuredFrom(visitor: Coordinates | null): string {
  return visitor ? `${visitor.latitude},${visitor.longitude}` : NOWHERE;
}
