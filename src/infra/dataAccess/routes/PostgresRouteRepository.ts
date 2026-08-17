import { sql } from "drizzle-orm";
import type { RoutePoint } from "~/domain/entities/post/gpx";
import { db } from "~/infra/dataAccess/db/connection";

export type StoredRoute = {
  points: RoutePoint[];
  lengthMeters: number;
  sourcePoints: number;
};

export type RouteToSave = {
  postId: string;
  points: readonly RoutePoint[];
  lengthMeters: number;
  sourcePoints: number;
};

/**
 * `LINESTRING(lon lat, lon lat, …)` — **longitud primero**, que es el orden de WKT y el contrario
 * al que la gente dice en voz alta ("latitud y longitud"). Invertirlo pone la ruta en otro
 * continente sin que nada falle, así que se construye en un solo sitio y con esta nota al lado.
 */
function toLineString(points: readonly RoutePoint[]): string {
  const pairs = points
    .map((point) => `${point.longitude} ${point.latitude}`)
    .join(",");

  return `LINESTRING(${pairs})`;
}

export class PostgresRouteRepository {
  /**
   * Guarda el recorrido, o reemplaza el que hubiera.
   *
   * `ON CONFLICT DO UPDATE` y no un borrado previo: subir un GPX nuevo sustituye al anterior en una
   * sola operación, sin un instante en el que la publicación se quede sin ruta.
   */
  async save(route: RouteToSave): Promise<void> {
    await db.execute(sql`
      INSERT INTO post_routes (post_id, path, length_meters, source_points)
      VALUES (
        ${route.postId},
        ST_GeogFromText(${toLineString(route.points)}),
        ${Math.round(route.lengthMeters)},
        ${route.sourcePoints}
      )
      ON CONFLICT (post_id) DO UPDATE SET
        path = EXCLUDED.path,
        length_meters = EXCLUDED.length_meters,
        source_points = EXCLUDED.source_points,
        created_at = now()
    `);
  }

  /**
   * El recorrido de una publicación, listo para dibujar.
   *
   * Se pide con `ST_AsGeoJSON` en vez de traer la geografía cruda: el WKB de PostGIS habría que
   * interpretarlo aquí, y GeoJSON lo entiende `JSON.parse`. Sus coordenadas vienen `[lon, lat]`
   * —el orden de GeoJSON— y se voltean al salir, para que del repositorio para arriba nadie más
   * tenga que acordarse.
   */
  async findByPostId(postId: string): Promise<StoredRoute | null> {
    const raw = await db.execute(sql`
      SELECT ST_AsGeoJSON(path) AS geojson, length_meters, source_points
      FROM post_routes WHERE post_id = ${postId}
    `);

    const row = raw.rows[0] as
      | { geojson: string; length_meters: number; source_points: number }
      | undefined;

    if (!row) return null;

    const parsed = JSON.parse(row.geojson) as { coordinates: number[][] };

    return {
      points: parsed.coordinates.map(([longitude, latitude]) => ({
        latitude,
        longitude,
      })),
      lengthMeters: Number(row.length_meters),
      sourcePoints: Number(row.source_points),
    };
  }

  /** Quitar la ruta sin tocar la publicación: es opcional, y se puede arrepentir. */
  async remove(postId: string): Promise<void> {
    await db.execute(sql`DELETE FROM post_routes WHERE post_id = ${postId}`);
  }
}
