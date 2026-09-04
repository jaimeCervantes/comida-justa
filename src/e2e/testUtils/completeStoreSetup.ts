import { sql } from "drizzle-orm";
import { COMMUNITY_ANCHOR } from "~/domain/entities/seller/proximity";
import { db } from "~/infra/dataAccess/db/connection";

/** Un logo cualquiera: lo que se comprueba es que el paso quede cumplido, no cómo se ve. */
export const TEST_LOGO_URL = "https://cdn.hazlosano.test/e2e-logo.webp";

/**
 * Deja una tienda de la suite con los cinco pasos de configuración resueltos.
 *
 * Se escribe **directo en la base** y no pasando por los formularios a propósito: subir un logo
 * exige interceptar el almacenamiento y dar de alta una sucursal exige la geolocalización del
 * navegador, y ninguna de las dos es lo que el escenario viene a comprobar —viene a comprobar que
 * con todo hecho la lista de pendientes se calla—. Montar el estado por el camino largo haría que
 * el escenario fallara por motivos que ya cubren otros.
 *
 * La sucursal se coloca en el ancla de la comunidad, que son coordenadas válidas de verdad: el
 * dominio descarta `0,0`, así que un punto de mentira dejaría el paso pendiente y el escenario
 * fallaría diciendo lo contrario de lo que pasa.
 *
 * Lo borra `deleteTestSellerByHandle`, que ya se lleva por delante las sucursales de la tienda.
 */
export async function completeStoreSetup(handle: string): Promise<void> {
  await db.execute(sql`
    UPDATE sellers
    SET logo_url = ${TEST_LOGO_URL},
        description = 'Pan de masa madre horneado cada mañana.'
    WHERE slug = ${handle}
  `);

  await db.execute(sql`
    INSERT INTO branches (seller_id, name, address, map_url, location)
    SELECT
      s.id,
      'Sucursal Centro',
      'Calle Principal 1, Tezonapa',
      ${`https://maps.google.com/?q=${COMMUNITY_ANCHOR.latitude},${COMMUNITY_ANCHOR.longitude}`},
      ST_SetSRID(
        ST_MakePoint(${COMMUNITY_ANCHOR.longitude}, ${COMMUNITY_ANCHOR.latitude}),
        4326
      )::geography
    FROM sellers s
    WHERE s.slug = ${handle}
  `);
}
