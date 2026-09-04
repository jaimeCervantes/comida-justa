import type { OrderStatus } from "./order";

/**
 * Qué le hace al inventario un paso del pedido.
 *
 * `reserve` resta, `release` devuelve y `none` no lo toca. Son tres y no un booleano porque un paso
 * que no mueve nada no es lo mismo que uno que devuelve: el segundo hay que aplicarlo.
 */
export type StockEffect = "reserve" | "release" | "none";

/**
 * Los estados en los que el pedido **ya descontó**.
 *
 * No hace falta una columna ni una tabla que lo recuerde, y ése es el hallazgo que hace barato este
 * slice: un pedido no vuelve atrás (`TRANSITIONS` no tiene marcha atrás), así que su estado actual
 * ya cuenta toda su historia. Si está en uno de estos tres, se aceptó; si está en `PENDING`, no.
 *
 * `DELIVERED` está aquí porque es verdad —descontó al aceptarse—, aunque hoy no se pueda cancelar
 * desde ahí: la lista dice lo que significa cada estado, no lo que la pantalla permite.
 */
const STOCK_APPLIED: readonly OrderStatus[] = [
  "CONFIRMED",
  "PREPARING",
  "DELIVERED",
];

/**
 * Qué hay que hacerle al inventario al mover un pedido de `from` a `to`.
 *
 * **Aceptar es el momento**, no hacer el pedido: uno pendiente es alguien preguntando, y lo que
 * compromete mercancía es que el vendedor diga que sí. Antes de eso, dos personas pueden estar
 * preguntando por la última dona y las dos tienen razón en preguntar.
 *
 * Cancelar devuelve **sólo si había descontado**. Un pedido cancelado desde `PENDING` nunca tocó el
 * inventario, y devolverle unidades inventaría existencias que nadie apartó.
 */
export function stockEffectOf(from: OrderStatus, to: OrderStatus): StockEffect {
  if (to === "CONFIRMED") return "reserve";
  if (to === "CANCELLED" && STOCK_APPLIED.includes(from)) return "release";

  return "none";
}

/** Lo que un renglón pide de una publicación. */
export interface StockDemand {
  /** `null` cuando la publicación se borró: el renglón sobrevive, el inventario ya no. */
  postId: string | null;
  title: string;
  quantity: number;
}

/**
 * Cuántas quedan de cada publicación. Ausente o `null` = **no lleva inventario**.
 *
 * Es un `Record` y no un `Map` porque quien lo construye lo hace de filas de la base y quien lo lee
 * sólo pregunta por clave.
 */
export type AvailableStock = Record<string, number | null | undefined>;

/**
 * Los renglones que el inventario no puede servir.
 *
 * Devuelve los renglones enteros y no un booleano para que quien avise pueda decir **cuáles**: un
 * "no te alcanza" sin nombre obliga al vendedor a repasar el pedido a mano.
 *
 * **Lo que no lleva inventario nunca falta.** Nulo significa que nadie cuenta esa publicación, así
 * que no hay número contra el que quedarse corto — la misma distinción que sostiene todo el slice 1.
 */
export function shortfalls(
  demands: readonly StockDemand[],
  available: AvailableStock,
): StockDemand[] {
  return demands.filter((demand) => {
    if (!demand.postId) return false;

    const stock = available[demand.postId];

    return typeof stock === "number" && stock < demand.quantity;
  });
}
