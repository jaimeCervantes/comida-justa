import { sql } from "drizzle-orm";
import { COMMUNITY_ANCHOR } from "~/domain/entities/seller/proximity";
import { db } from "~/infra/dataAccess/db/connection";

/**
 * Le cuelga una sucursal a una tienda de la suite.
 *
 * Se escribe directo en la base y no pasando por el formulario porque el alta pide la
 * geolocalización del navegador o un enlace de Google Maps que hay que resolver por red: dos cosas
 * que ya cubren sus propios escenarios y que aquí solo servirían para montar el estado de partida.
 *
 * **No hay forma de sembrar una sin ubicación, y es a propósito.** `branches.location` es
 * `NOT NULL` y `AddBranchUseCase` rechaza el alta sin coordenadas, así que una sucursal sin punto
 * en el mapa no existe. El slice 2 lo intentó —el `INSERT` reventó contra la restricción— y de ahí
 * salió el hallazgo. Una utilidad de pruebas que pudiera montar un estado imposible haría pasar
 * escenarios que no describen el producto.
 *
 * Lo borra `deleteTestSellerByHandle` junto con su tienda.
 */
export async function seedBranch(handle: string, name: string): Promise<void> {
  await db.execute(sql`
    INSERT INTO branches (seller_id, name, address, map_url, location)
    SELECT
      s.id,
      ${name},
      ${`Calle Principal 1, Tezonapa (${name})`},
      ${`https://maps.google.com/?q=${COMMUNITY_ANCHOR.latitude},${COMMUNITY_ANCHOR.longitude}`},
      ST_SetSRID(
        ST_MakePoint(${COMMUNITY_ANCHOR.longitude}, ${COMMUNITY_ANCHOR.latitude}),
        4326
      )::geography
    FROM sellers s
    WHERE s.slug = ${handle}
  `);
}
