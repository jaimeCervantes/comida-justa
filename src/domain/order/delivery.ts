import {
  isTrackable,
  OPEN_STATUSES,
  type Order,
  type OrderStatus,
} from "./order";

/**
 * A qué velocidad se asume que avanza el repartidor, en km/h.
 *
 * **Es una suposición, no una medición**: un repartidor en moto por ciudad, con paradas, semáforos
 * y tráfico, sobre la distancia en línea recta. No hay ruteo real —calles, sentidos, tráfico en
 * vivo—; eso sería Google Directions u OSRM, y otro slice. Por eso el tiempo que sale de aquí se
 * enseña siempre marcado como aproximado.
 */
export const ASSUMED_COURIER_SPEED_KMH = 20;

const METERS_PER_MINUTE = (ASSUMED_COURIER_SPEED_KMH * 1000) / 60;

/**
 * Minutos estimados para recorrer esa distancia a la velocidad asumida.
 *
 * Hacia arriba y nunca menos de uno: "0 min" se lee como "ya llegó", y eso solo lo dice el cambio a
 * Entregado, no una cuenta.
 */
export function etaMinutes(distanceMeters: number): number {
  return Math.max(1, Math.ceil(distanceMeters / METERS_PER_MINUTE));
}

export type DeliveryProgressInput = Pick<
  Order,
  "status" | "courierLocation" | "deliveryLocation" | "courierDistanceMeters"
>;

/**
 * Desde cuándo la última posición del repartidor ya no dice dónde está.
 *
 * El repartidor manda cada 15 s mientras su página está a la vista; una página web **no puede** leer
 * el GPS con el teléfono bloqueado o en segundo plano. Dos minutos son ocho envíos perdidos
 * seguidos: ya no es un tropiezo de red, es que se detuvo — bloqueó el teléfono o se fue a Google
 * Maps. A partir de ahí no se presenta como actual.
 */
export const COURIER_LOCATION_STALE_AFTER_MS = 2 * 60_000;

export function isCourierLocationStale(updatedAt: Date, now: Date): boolean {
  return now.getTime() - updatedAt.getTime() >= COURIER_LOCATION_STALE_AFTER_MS;
}

/** Los minutos enteros que lleva sin moverse, o `null` si todavía está fresca. */
export function staleMinutes(updatedAt: Date, now: Date): number | null {
  if (!isCourierLocationStale(updatedAt, now)) return null;

  return Math.floor((now.getTime() - updatedAt.getTime()) / 60_000);
}

export interface DeliveryProgress {
  distanceMeters: number;
  /** `null` cuando la posición es vieja: estimar desde un punto que ya no es actual es inventar. */
  etaMinutes: number | null;
  /** Cuánto hace de la posición, solo si ya es vieja (`staleMinutes`); con ella la distancia se dice en pasado. */
  staleMinutes: number | null;
}

/**
 * A qué distancia va el repartidor y cuánto le falta, o `null` si no hay nada honesto que decir.
 *
 * Hacen falta **las dos posiciones** —la del repartidor y el destino que compartió el comprador— y
 * que el pedido siga Enviado. Con una sola, el mapa sigue enseñando la del repartidor como antes,
 * sin cifra: un "a 0 m" o un hueco serían peor que callar.
 *
 * **La distancia no se calcula aquí.** La pone PostGIS (`ST_Distance` sobre `geography`, con el
 * elipsoide), la misma cifra que ya enseñan el directorio y las tarjetas; la única aritmética de
 * distancia en JavaScript del proyecto es la de `locationFreshness.ts`, y es para decidir si vale
 * la pena escribir, nunca para enseñarle un número a nadie. Si la base no la trajo, no se inventa.
 *
 * **Con la posición vieja** (`isCourierLocationStale`) la distancia se sigue dando —es un dato real,
 * de hace X minutos— pero el tiempo estimado no.
 */
export function deliveryProgress(
  order: DeliveryProgressInput,
  now: Date,
): DeliveryProgress | null {
  if (!isTrackable(order.status)) return null;
  if (!order.courierLocation || !order.deliveryLocation) return null;
  if (order.courierDistanceMeters == null) return null;

  const stale = staleMinutes(order.courierLocation.updatedAt, now);

  return {
    distanceMeters: order.courierDistanceMeters,
    etaMinutes: stale === null ? etaMinutes(order.courierDistanceMeters) : null,
    staleMinutes: stale,
  };
}

/**
 * En qué estados el comprador todavía puede compartir o actualizar a dónde se le entrega.
 *
 * **Mientras el pedido siga abierto, no solo Enviado**: quien no lo compartió al confirmar tiene
 * que poder hacerlo antes de que salga el repartidor. Cuando ya llegó o se canceló no queda entrega
 * a la que apuntar. Es una lista y no solo la función porque el repositorio la pone en el `WHERE`
 * de la escritura.
 */
export const DELIVERY_SHAREABLE_STATUSES: readonly OrderStatus[] =
  OPEN_STATUSES;

export function canShareDeliveryLocation(status: OrderStatus): boolean {
  return DELIVERY_SHAREABLE_STATUSES.includes(status);
}
