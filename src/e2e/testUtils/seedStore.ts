import { sql } from "drizzle-orm";
import { COMMUNITY_ANCHOR } from "~/domain/entities/seller/proximity";
import { db } from "~/infra/dataAccess/db/connection";

/** Un grado de latitud son ~111.32 km en cualquier meridiano; mover solo la latitud evita el coseno. */
const KM_PER_LATITUDE_DEGREE = 111.32;

export type SeededStore = {
  name: string;
  handle: string;
  phone: string;
};

/**
 * Siembra una tienda de prueba **sin dueño**, y opcionalmente su sucursal a la distancia que pida
 * el escenario.
 *
 * `user_id` se deja en `NULL` a propósito. Colgarla de la cuenta de la suite bloquearía a los seis
 * escenarios que empiezan abriendo tienda —`/cuenta` deja de pintar el formulario de alta cuando ya
 * hay una— y ese fallo ya costó una corrida entera (ver `testData.ts`). El barrido la reconoce por
 * el prefijo `e2e-` del slug.
 *
 * La sucursal se coloca desplazando **solo la latitud** desde el ancla de la comunidad: sobre un
 * meridiano un grado son ~111.32 km sin importar dónde estés, así que la distancia sale sin meter
 * el coseno de la longitud y el escenario se lee como lo que quiere decir ("a 120 km").
 */
export async function seedStore(
  store: SeededStore,
  branchDistanceKm: number | null,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO sellers (name, slug, category, phone, user_id)
    VALUES (${store.name}, ${store.handle}, 'Food', ${store.phone}, NULL)
  `);

  if (branchDistanceKm === null) return;

  const latitude =
    COMMUNITY_ANCHOR.latitude + branchDistanceKm / KM_PER_LATITUDE_DEGREE;

  await db.execute(sql`
    INSERT INTO branches (seller_id, name, address, map_url, location)
    SELECT
      s.id,
      ${`Sucursal ${store.name}`},
      ${`A ${branchDistanceKm} km del ancla`},
      ${`https://maps.google.com/?q=${latitude},${COMMUNITY_ANCHOR.longitude}`},
      ST_SetSRID(
        ST_MakePoint(${COMMUNITY_ANCHOR.longitude}, ${latitude}),
        4326
      )::geography
    FROM sellers s
    WHERE s.slug = ${store.handle}
  `);
}
