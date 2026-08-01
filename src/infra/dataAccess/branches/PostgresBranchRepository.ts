import { sql } from "drizzle-orm";
import type { Branch } from "~/domain/entities/seller/types";
import { db } from "~/infra/dataAccess/db/connection";
import type IBranchRepository from "~/use_cases/addBranch/ports/IBranchRepository";
import type { NewBranch } from "~/use_cases/addBranch/ports/IBranchRepository";

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
