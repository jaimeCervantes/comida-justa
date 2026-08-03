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
 * El ancla desde la que se mide "local": la comunidad a la que sirve el sitio.
 *
 * Son las coordenadas de la sucursal que ya existe en la base, que es el punto de referencia de la
 * comunidad hoy. **Cuando el sitio sirva a más de un pueblo esto deja de ser una constante** y pasa
 * a ser un parámetro de la consulta —el pueblo del visitante, o el de la tienda—; hasta entonces,
 * un valor con nombre es más honesto que fingir una configuración que nadie configura.
 */
export const COMMUNITY_ANCHOR: Coordinates = {
  latitude: 18.6005415256606,
  longitude: -96.6872065729976,
};

/** ¿Esta distancia cae dentro del radio sostenible? */
export function isWithinSustainableRadius(meters: number): boolean {
  return Number.isFinite(meters) && meters >= 0
    ? meters <= SUSTAINABLE_RADIUS_METERS
    : false;
}
