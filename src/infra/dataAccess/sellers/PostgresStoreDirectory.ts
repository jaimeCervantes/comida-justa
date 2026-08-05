import { sql } from "drizzle-orm";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import {
  type DirectoryKind,
  type DirectoryPage,
  onlyProducers,
} from "~/domain/entities/seller/directory";
import {
  anchorFor,
  SUSTAINABLE_RADIUS_METERS,
} from "~/domain/entities/seller/proximity";
import { db } from "~/infra/dataAccess/db/connection";

interface StoreRow {
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  distance_meters: string | null;
  publication_count: number;
  total_count: number;
}

/**
 * El directorio de tiendas, paginado.
 *
 * **Solo las que tienen `slug`**: sin dirección pública no hay a dónde enlazar, y las tiendas que
 * creó el chatbot nacieron sin ella.
 *
 * El filtro de productores tiene dos mitades que viven en sitios distintos a propósito:
 *
 * 1. **Quién produce** lo dice lo que publica (`EXISTS` sobre `posts`), no una columna del vendedor.
 *    Así una tienda entra el día que publica su primer producto propio, sin que nadie la marque.
 * 2. **Si eso es local** lo dice la distancia, no la declaración: su sucursal tiene que caer dentro
 *    del radio sostenible del ancla de la comunidad. `branches.location` es `geography`, así que
 *    `ST_DWithin` recibe metros y usa el índice espacial en vez de calcular fila por fila.
 *
 * Consecuencia buscada: una tienda **sin sucursal** no aparece aquí aunque publique como productor.
 * Sin ubicación no hay distancia que verificar, y esa es justo la razón para completar la tienda.
 */
export async function listStores(
  kind: DirectoryKind,
  page: number,
  pageSize: number,
  near: Coordinates | null = null,
): Promise<DirectoryPage> {
  const withRadius = await queryStores(kind, page, pageSize, near, true);

  /*
   * El respaldo para quien mira desde lejos.
   *
   * Con el ancla puesta en el visitante, alguien en otro estado puede no tener un solo productor en
   * sus 50 km, y lo que veía entonces era una página en blanco — el peor resultado posible: no
   * distingue "no hay nadie cerca de ti" de "esto está roto". Así que se repite la consulta sin la
   * mitad del radio y se dice que lo que sale queda lejos.
   *
   * Se cae **solo el radio**, no el `origin = 'productor'`: si no hay productores, no hay
   * productores, y llenar el directorio con negocios que no producen sería mentir sobre lo que la
   * página promete. Hoy mismo, con 0 publicaciones `productor` en la base, este respaldo devuelve
   * vacío a propósito.
   */
  if (withRadius.total > 0 || !near || !onlyProducers(kind)) return withRadius;

  return {
    ...(await queryStores(kind, page, pageSize, near, false)),
    outsideRadius: true,
  };
}

async function queryStores(
  kind: DirectoryKind,
  page: number,
  pageSize: number,
  near: Coordinates | null,
  withinRadius: boolean,
): Promise<DirectoryPage> {
  const offset = (page - 1) * pageSize;
  const anchor = anchorFor(near);
  const radiusFilter = withinRadius
    ? sql`AND EXISTS (
          SELECT 1 FROM branches b
          WHERE b.seller_id = s.id
            AND ST_DWithin(
              b.location,
              ST_SetSRID(
                ST_MakePoint(
                  ${anchor.longitude},
                  ${anchor.latitude}
                ),
                4326
              )::geography,
              ${SUSTAINABLE_RADIUS_METERS}
            )
        )`
    : sql``;
  const producerFilter = onlyProducers(kind)
    ? sql`AND EXISTS (
          SELECT 1 FROM posts p
          WHERE p.seller_id = s.id AND p.origin = 'productor'
        )
        ${radiusFilter}`
    : sql``;

  /*
   * La distancia a la sucursal más cercana de cada tienda, o `NULL`.
   *
   * Es el dato que faltaba en las dos páginas cuya razón de ser **es** la proximidad: hasta ahora
   * la usaban solo para filtrar a los productores, y luego listaban por nombre alfabético, que no
   * le sirve a nadie que esté decidiendo dónde ir.
   */
  const distance = near
    ? sql`(
        SELECT MIN(
          ST_Distance(
            b.location,
            ST_SetSRID(
              ST_MakePoint(${near.longitude}, ${near.latitude}),
              4326
            )::geography
          )
        )
        FROM branches b
        WHERE b.seller_id = s.id
      )`
    : sql`NULL::double precision`;

  // `NULLS LAST` por lo mismo que en el catálogo: una tienda sin sucursal baja, no desaparece.
  const order = near
    ? sql`distance_meters ASC NULLS LAST, s.name`
    : sql`s.name`;

  const raw = await db.execute(sql`
    SELECT
      s.slug,
      s.name,
      s.description,
      s.logo_url,
      ${distance} AS distance_meters,
      (SELECT COUNT(*) FROM posts p WHERE p.seller_id = s.id)::int AS publication_count,
      COUNT(*) OVER()::int AS total_count
    FROM sellers s
    WHERE s.slug IS NOT NULL
    ${producerFilter}
    ORDER BY ${order}
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  const rows = raw.rows as unknown as StoreRow[];
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

  return {
    stores: rows.map((row) => ({
      handle: row.slug,
      name: row.name,
      description: row.description,
      logoUrl: row.logo_url,
      distanceMeters:
        row.distance_meters === null || row.distance_meters === undefined
          ? null
          : Number(row.distance_meters),
      publicationCount: Number(row.publication_count),
    })),
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
