import { type SQL, sql } from "drizzle-orm";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import {
  type DirectoryKind,
  type DirectoryPage,
  onlyProducers,
  type StoreSummary,
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
  const withRadius = await queryStores(
    producerFilter(kind, near, true),
    page,
    pageSize,
    near,
  );

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
    ...(await queryStores(
      producerFilter(kind, near, false),
      page,
      pageSize,
      near,
    )),
    outsideRadius: true,
  };
}

/**
 * Las tiendas que tienen algo publicado en un subárbol del catálogo, lo más cercano primero.
 *
 * Es lo que pide la sección «Cerca de ti» de cada pilar: quién de la zona sostiene *este* hábito.
 * El pilar de una tienda **se deriva de lo que publica** y no de una columna suya — `sellers.category`
 * es todavía el texto libre que dejó el chatbot—, así que el filtro es el mismo `EXISTS` sobre
 * `posts` que usa el directorio de productores, cambiando el `origin` por las claves de categoría.
 *
 * **No filtra por radio, solo ordena por distancia.** El directorio de productores sí lo hace porque
 * promete proximidad verificada; aquí la promesa es otra —lo más cercano que hay de este pilar— y
 * cada tarjeta enseña su distancia real, así que nada se vende como cercano sin serlo. Filtrar
 * además por radio dejaría la sección vacía para casi todo visitante mientras las publicaciones del
 * mismo pilar sí salen (`getPostsByCategory` tampoco filtra), y esa incoherencia se lee como un
 * error.
 */
export async function listStoresByCategory(
  categoryKeys: readonly string[],
  limit: number,
  near: Coordinates | null = null,
): Promise<readonly StoreSummary[]> {
  // `IN ()` no es SQL válido: una clave desconocida llega aquí como lista vacía, no como error.
  if (categoryKeys.length === 0) return [];

  const keys = sql.join(
    categoryKeys.map((key) => sql`${key}`),
    sql`, `,
  );
  const filter = sql`AND EXISTS (
        SELECT 1 FROM posts p
        WHERE p.seller_id = s.id
          AND (p.category IN (${keys}) OR p.sub_category IN (${keys}))
      )`;

  const { stores } = await queryStores(filter, 1, limit, near);

  return stores;
}

/** Quién produce, y —cuando se pide— si eso cae dentro del radio sostenible. */
function producerFilter(
  kind: DirectoryKind,
  near: Coordinates | null,
  withinRadius: boolean,
): SQL {
  if (!onlyProducers(kind)) return sql``;

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

  return sql`AND EXISTS (
        SELECT 1 FROM posts p
        WHERE p.seller_id = s.id AND p.origin = 'productor'
      )
      ${radiusFilter}`;
}

/**
 * El listado de tiendas con su distancia, paginado. Quien llama pone **su** filtro.
 *
 * La forma —qué columnas, cómo se mide la distancia, cómo se ordena y cómo se cuenta el total— es la
 * misma para el directorio y para la sección de un pilar; lo único que cambia es a quién se deja
 * entrar. Copiar la consulta para cambiar un `EXISTS` habría sido el segundo bloque casi idéntico
 * que `AGENTS.md` llama fallo de diseño.
 */
async function queryStores(
  filter: SQL,
  page: number,
  pageSize: number,
  near: Coordinates | null,
): Promise<DirectoryPage> {
  const offset = (page - 1) * pageSize;

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
    ${filter}
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
