import type { Coordinates } from "./coordinates";

/**
 * Hasta dónde sigue siendo local.
 *
 * 50 km no es un número redondo elegido al azar: es la cuenca real de abasto de la comunidad
 * —cubre Córdoba (~40 km) y llega a Orizaba (~55 km al límite)—, la distancia que se recorre y se
 * regresa el mismo día. Ese es el criterio: mientras los kilómetros sigan siendo sostenibles en
 * **nutrición** (lo fresco no pierde un día en carretera), **medio ambiente** (el transporte no se
 * come el argumento), **costo** y **desperdicio**, sigue contando como local.
 *
 * Vive aquí, con nombre, y no suelto dentro de una consulta, para que mover el criterio sea una
 * decisión de negocio y no un `sed` por el repositorio.
 */
export const SUSTAINABLE_RADIUS_KM = 50;

export const SUSTAINABLE_RADIUS_METERS = SUSTAINABLE_RADIUS_KM * 1000;

/**
 * El ancla por defecto: la comunidad a la que nació sirviendo el sitio.
 *
 * Son las coordenadas de la sucursal que ya existe en la base. Sigue siendo la referencia **cuando
 * no sabemos dónde está quien mira**; en cuanto lo sabemos, el ancla es esa persona (ver
 * `anchorFor`). Esto es lo que este comentario anticipaba cuando decía que el día que el sitio
 * sirviera a más de un pueblo dejaría de ser una constante.
 */
export const COMMUNITY_ANCHOR: Coordinates = {
  latitude: 18.6005415256606,
  longitude: -96.6872065729976,
};

/**
 * Desde dónde se mide "local": desde quien mira, si lo sabemos.
 *
 * "Local" no es una propiedad del vendedor, es una relación entre dos puntos, y el punto que
 * importa es dónde está quien va a ir a comprar. Medirlo siempre desde un pueblo fijo convertía el
 * directorio de productores en una lista útil para quien vive ahí e **inservible para todos los
 * demás**: alguien en otro estado veía productores "locales" a mil kilómetros, o no veía ninguno.
 *
 * Sin ubicación se vuelve al ancla de la comunidad, que es la mejor suposición disponible: es donde
 * está el sitio y donde están sus tiendas.
 */
export function anchorFor(visitor: Coordinates | null): Coordinates {
  return visitor ?? COMMUNITY_ANCHOR;
}

/** ¿Esta distancia cae dentro del radio sostenible? */
export function isWithinSustainableRadius(meters: number): boolean {
  return Number.isFinite(meters) && meters >= 0
    ? meters <= SUSTAINABLE_RADIUS_METERS
    : false;
}
