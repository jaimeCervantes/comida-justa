import { sql } from "drizzle-orm";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type { Branch } from "~/domain/entities/seller/types";
import { db } from "~/infra/dataAccess/db/connection";
import type IBranchRepository from "~/use_cases/addBranch/ports/IBranchRepository";
import type { NewBranch } from "~/use_cases/addBranch/ports/IBranchRepository";

interface DistanceRow {
  distance_meters: number | string | null;
  [key: string]: unknown;
}

interface BranchRow {
  id: string;
  seller_id: string;
  name: string;
  address: string;
  map_url: string;
  latitude: number;
  longitude: number;
  [key: string]: unknown;
}

/**
 * `branches` se consulta con SQL crudo y no con el espejo Drizzle.
 *
 * `location` es un `geography(POINT,4326)` de PostGIS: no hay tipo Drizzle que lo represente, y
 * escribirlo exige `ST_SetSRID(ST_MakePoint(...))` de todos modos. Un espejo a medias —con la
 * tabla declarada pero sin su única columna interesante— sería una trampa para quien venga después,
 * así que aquí manda el SQL, igual que en `PostgresPostQueryRepository`.
 *
 * Nota de orden: en PostGIS el punto se arma **(longitud, latitud)**, al revés de como se dictan.
 */
export class PostgresBranchRepository implements IBranchRepository {
  async listBySeller(sellerId: string): Promise<Branch[]> {
    const result = await db.execute(sql`
      SELECT
        b.id::text        AS id,
        b.seller_id::text AS seller_id,
        b.name,
        b.address,
        b.map_url,
        ST_Y(b.location::geometry) AS latitude,
        ST_X(b.location::geometry) AS longitude
      FROM branches b
      WHERE b.seller_id = ${sellerId}::uuid
      ORDER BY b.name
    `);

    return (result.rows as unknown as BranchRow[]).map(toBranch);
  }

  /*
   * Mismo cálculo que `PostgresStoreDirectory`, acotado a una tienda: `MIN` sobre sus sucursales,
   * porque a quien mira le importa la que tiene más cerca, no el promedio ni la primera de la lista.
   *
   * Va en su propia consulta en vez de salir de `listBySeller` —que ya trae las coordenadas— para no
   * calcular la distancia en JavaScript: `ST_Distance` sobre `geography` usa el elipsoide y es la
   * cifra que ya enseñan el directorio y las tarjetas. La página la pide dentro del mismo
   * `Promise.all` que el resto, así que no añade una espera en serie.
   *
   * `MIN` de cero filas es `NULL`, así que una tienda sin sucursales cae sola en el mismo camino que
   * un visitante sin ubicación: no hay distancia que enseñar.
   */
  async distanceToNearestBranch(
    sellerId: string,
    near: Coordinates | null,
  ): Promise<number | null> {
    if (!near) return null;

    const result = await db.execute(sql`
      SELECT MIN(
        ST_Distance(
          b.location,
          ST_SetSRID(
            ST_MakePoint(${near.longitude}, ${near.latitude}),
            4326
          )::geography
        )
      ) AS distance_meters
      FROM branches b
      WHERE b.seller_id = ${sellerId}::uuid
    `);

    const raw = (result.rows as unknown as DistanceRow[])[0]?.distance_meters;

    return raw === null || raw === undefined ? null : Number(raw);
  }

  async save(branch: NewBranch): Promise<Branch> {
    const result = await db.execute(sql`
      INSERT INTO branches (seller_id, name, address, map_url, location)
      VALUES (
        ${branch.sellerId}::uuid,
        ${branch.name},
        ${branch.address},
        ${branch.mapUrl},
        ST_SetSRID(
          ST_MakePoint(${branch.coordinates.longitude}, ${branch.coordinates.latitude}),
          4326
        )::geography
      )
      RETURNING
        id::text        AS id,
        seller_id::text AS seller_id,
        name,
        address,
        map_url,
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude
    `);

    return toBranch((result.rows as unknown as BranchRow[])[0]);
  }
}

function toBranch(row: BranchRow): Branch {
  return {
    id: row.id,
    sellerId: row.seller_id,
    name: row.name,
    address: row.address,
    mapUrl: row.map_url,
    coordinates: {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    },
  };
}
