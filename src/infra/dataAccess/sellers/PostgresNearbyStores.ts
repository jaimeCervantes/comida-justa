import { sql } from "drizzle-orm";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type {
  MappedStore,
  MappedStorePost,
} from "~/domain/entities/seller/map";
import { db } from "~/infra/dataAccess/db/connection";
import { PUBLISHED_POSTS } from "~/infra/dataAccess/db/publishedPosts";

const RECENT_STORE_POSTS_LIMIT = 4;

export type StoreMapLocaleOptions = {
  locale: string;
  fallbackLocale: string;
};

interface NearbyStoreRow {
  slug: string;
  name: string;
  logo_url: string | null;
  latitude: number;
  longitude: number;
  meters: number;
  recent_posts: MappedStorePost[] | null;
  [key: string]: unknown;
}

/**
 * Las tiendas que se pueden situar en un mapa, de la más cercana a la más lejana.
 *
 * Tres condiciones, y cada una descarta algo que no se puede pintar: sin `slug` no hay a dónde
 * enlazar el pin, sin sucursal no hay dónde ponerlo, y sin nada publicado el pin manda a un
 * catálogo vacío. `DISTINCT ON` deja una fila por tienda —la de su sucursal más cercana— porque en
 * el mapa una tienda es un pin, no uno por local.
 *
 * No filtra por radio: el mapa se encuadra solo con lo que haya, y si todo queda lejos eso también
 * es una respuesta —la misma que da el listado en vez de una página en blanco—.
 */
export async function listStoresToMap(
  near: Coordinates,
  limit: number,
  { locale, fallbackLocale }: StoreMapLocaleOptions,
): Promise<MappedStore[]> {
  const raw = await db.execute(sql`
    SELECT DISTINCT ON (s.id)
      s.slug,
      s.name,
      s.logo_url,
      ST_Y(b.location::geometry) AS latitude,
      ST_X(b.location::geometry) AS longitude,
      ST_Distance(
        b.location,
        ST_SetSRID(ST_MakePoint(${near.longitude}, ${near.latitude}), 4326)::geography
      ) AS meters,
      COALESCE(rp.recent_posts, '[]'::jsonb) AS recent_posts
    FROM sellers s
    JOIN branches b ON b.seller_id = s.id
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_build_object(
          'title',    COALESCE(requested.title, fallback.title),
          'slug',     COALESCE(requested.slug, fallback.slug),
          'imageUrl', media.url,
          'imageAlt', COALESCE(media.alt, requested.title, fallback.title)
        )
        ORDER BY p.created_at DESC
      ) AS recent_posts
      FROM (
        SELECT p.id, p.created_at
        FROM posts p
        WHERE ${PUBLISHED_POSTS}
          AND p.seller_id = s.id
        ORDER BY p.created_at DESC
        LIMIT ${RECENT_STORE_POSTS_LIMIT}
      ) p
      LEFT JOIN post_translations requested
        ON requested.post_id = p.id
       AND requested.locale = ${locale}
      LEFT JOIN post_translations fallback
        ON fallback.post_id = p.id
       AND fallback.locale = ${fallbackLocale}
      LEFT JOIN LATERAL (
        SELECT pm.url, pm.alt
        FROM post_media pm
        WHERE pm.post_id = p.id
          AND pm.type = 'image'
        ORDER BY pm.sort_order ASC
        LIMIT 1
      ) media ON TRUE
      WHERE COALESCE(requested.slug, fallback.slug) IS NOT NULL
    ) rp ON TRUE
    WHERE s.slug IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM posts p WHERE ${PUBLISHED_POSTS} AND p.seller_id = s.id
      )
    ORDER BY s.id, meters ASC
  `);

  return (raw.rows as unknown as NearbyStoreRow[])
    .map((row) => ({
      handle: row.slug,
      name: row.name,
      logoUrl: row.logo_url,
      recentPosts: row.recent_posts ?? [],
      coordinates: {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
      },
      meters: Number(row.meters),
    }))
    .sort((a, b) => a.meters - b.meters)
    .slice(0, limit);
}
