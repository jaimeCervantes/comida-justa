import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { seedBranch } from "./seedBranch";

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
 * Lo borra `deleteTestSellerByHandle`, que ya se lleva por delante las sucursales de la tienda.
 */
export async function completeStoreSetup(handle: string): Promise<void> {
  await db.execute(sql`
    UPDATE sellers
    SET logo_url = ${TEST_LOGO_URL},
        description = 'Pan de masa madre horneado cada mañana.'
    WHERE slug = ${handle}
  `);

  await seedBranch(handle, "Sucursal Centro");
}
