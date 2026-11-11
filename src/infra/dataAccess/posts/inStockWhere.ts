import { type SQL, sql } from "drizzle-orm";
import { PRODUCT_KIND } from "~/domain/entities/post/hazloSanoProduct";

/**
 * «Solo con existencia», en SQL: la única regla, compartida por los listados y por la búsqueda.
 *
 * Sale el **producto** agotado. Un anuncio, un evento, un servicio o una práctica no se agotan
 * —`canTrackStock` en el dominio dice lo mismo—, así que se quedan aunque el filtro esté puesto:
 * en el home o en un perfil, encenderlo no debe vaciar lo que no se vende por piezas.
 *
 * `is_available` y no `stock_quantity`: un producto sin inventario (nulo) también puede marcarse
 * agotado a mano, y con inventario la columna ya se deriva de las piezas (`availabilityForStock`).
 *
 * `p` es el alias de `posts` en todas las consultas que la usan.
 */
export function inStockWhere(onlyAvailable: boolean | undefined): SQL {
  return onlyAvailable
    ? sql`(p.kind <> ${PRODUCT_KIND} OR p.is_available IS TRUE)`
    : sql`TRUE`;
}
