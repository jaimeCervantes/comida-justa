import { type SQL, sql } from "drizzle-orm";
import { PRODUCT_KIND } from "~/domain/entities/post/hazloSanoProduct";
import type { IndexingCounts } from "~/domain/entities/post/indexingReport";
import { HAZLO_SANO_ORIGIN_PREFIX } from "~/domain/entities/post/origin";
import type { OriginCount } from "~/domain/entities/post/originReport";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import { db } from "~/infra/dataAccess/db/connection";
import type {
  IPostQueryRepository,
  PaginatedPostsResult,
  PostData,
} from "./IPostQueryRepository";

interface PostRow {
  id: string;
  user_id: string;
  price: string | null;
  kind: string | null;
  origin: string | null;
  category: string | null;
  sub_category: string | null;
  is_available: boolean;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  created_at: Date;
  user_name: string | null;
  user_email: string | null;
  user_image: string | null;
  translations: Array<{
    locale: string;
    title: string;
    slug: string;
    content: string;
  }>;
  media: Array<{ url: string; type: string; alt: string | null }>;
  distance_meters: string | null;
  total_count: number;
  [key: string]: unknown;
}

/**
 * Todo lo que es un producto, lo venda quien lo venda.
 *
 * Solo mira `kind` y **no** `origin`: `/productos` pasó de ser el escaparate de la marca a ser el
 * de la comunidad entera. Lo que separa un producto de un anuncio es que se vende, no de quién es.
 */
const PRODUCTS_WHERE: SQL = sql`p.kind = ${PRODUCT_KIND}`;

/** Solo lo que vende Hazlo Sano: `kind = producto` + `origin` `hazlo_sano_*`. */
const HAZLO_SANO_PRODUCTS_WHERE: SQL = sql`p.kind = ${PRODUCT_KIND} AND p.origin LIKE ${`${HAZLO_SANO_ORIGIN_PREFIX}%`}`;

const ALL_POSTS_WHERE: SQL = sql`TRUE`;

/**
 * Las columnas que compone una tarjeta, y los `LATERAL` que traen sus traducciones y su media.
 *
 * Están fuera de `getPaginatedPosts` porque las relacionadas necesitan **la misma forma con otro
 * orden** —por parecido, no por fecha—, y tener la proyección escrita dos veces era garantizar que
 * un día devolvieran cosas distintas.
 */
const POST_COLUMNS: SQL = sql`
        p.id,
        p.user_id,
        p.price::text,
        p.kind,
        p.origin,
        p.category,
        p.sub_category,
        p.is_available,
        p.contact_phone,
        p.contact_email,
        p.contact_whatsapp,
        p.created_at,
        u.name AS user_name,
        u.email AS user_email,
        u.image AS user_image,
        COALESCE(t.translations, '[]'::jsonb) AS translations,
        COALESCE(m.media, '[]'::jsonb)        AS media`;

const POST_JOINS: SQL = sql`
      FROM posts p
      LEFT JOIN users u
        ON u.id = p.user_id
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(
          jsonb_build_object(
            'locale',  locale,
            'title',   title,
            'slug',    slug,
            'content', content
          )
        ) AS translations
        FROM post_translations
        WHERE post_id = p.id
      ) t ON TRUE
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(
          jsonb_build_object(
            'url',  url,
            'type', type,
            'alt',  alt
          )
          ORDER BY sort_order
        ) AS media
        FROM post_media
        WHERE post_id = p.id
      ) m ON TRUE`;

/**
 * A qué distancia está la tienda de cada publicación, en metros, o `NULL`.
 *
 * `MIN` porque una tienda puede tener varias sucursales y lo que decide es la más cercana. Es un
 * `LEFT JOIN LATERAL` y no un `JOIN` a secas para que **nada desaparezca del listado por no tener
 * ubicación**: lo publicado sin tienda, o por una tienda que aún no dio su sucursal, sigue estando
 * ahí, solo que sin distancia.
 */
function distanceColumn(near: Coordinates | null): SQL {
  if (!near) return sql`NULL::double precision AS distance_meters`;

  return sql`(
    SELECT MIN(
      ST_Distance(
        b.location,
        ST_SetSRID(ST_MakePoint(${near.longitude}, ${near.latitude}), 4326)::geography
      )
    )
    FROM branches b
    WHERE b.seller_id = p.seller_id
  ) AS distance_meters`;
}

/**
 * El orden del listado.
 *
 * Sin ubicación de quien mira, lo más reciente primero, que es lo que había siempre. Con ella —y
 * si el listado lo pidió— lo más cercano primero **y `NULLS LAST`**: quien no tiene ubicación no se
 * elimina de la lista, baja al final. Por eso no hay filtro por radio aquí: si no hay nada cerca no
 * se devuelve una página vacía, se devuelve lo que hay diciendo a qué distancia está.
 *
 * Saber la distancia y ordenarse por ella son decisiones **separadas**, y separarlas es lo que deja
 * al home ser un feed: ahí la distancia es un dato de cada tarjeta, no el criterio, porque lo que
 * esa página promete es lo último que publicó la comunidad.
 */
function orderClause(near: Coordinates | null, sortByDistance: boolean): SQL {
  if (!near || !sortByDistance) return sql`p.created_at DESC`;

  return sql`distance_meters ASC NULLS LAST, p.created_at DESC`;
}

interface ListingOptions {
  /** Dónde está quien mira; sin ella no se calcula ninguna distancia. */
  near?: Coordinates | null;
  /** Si además de calcularla, la distancia manda en el orden. */
  sortByDistance?: boolean;
}

/** La misma forma que devuelve `getPaginatedPosts` cuando la consulta no encuentra nada. */
function emptyPage(page: number): PaginatedPostsResult {
  return {
    posts: [],
    nextPage: null,
    prevPage: page > 1 ? page - 1 : 1,
    total: 0,
    totalPages: 0,
  };
}

export class PostgresPostQueryRepository implements IPostQueryRepository {
  async getMultiplePosts(
    page: number,
    pageSize: number,
    near: Coordinates | null = null,
  ): Promise<PaginatedPostsResult> {
    // El home es un feed: gana la distancia, conserva el orden cronológico.
    return this.getPaginatedPosts(ALL_POSTS_WHERE, page, pageSize, {
      near,
      sortByDistance: false,
    });
  }

  async getProducts(
    page: number,
    pageSize: number,
    near: Coordinates | null = null,
  ): Promise<PaginatedPostsResult> {
    return this.getPaginatedPosts(PRODUCTS_WHERE, page, pageSize, {
      near,
      sortByDistance: true,
    });
  }

  async getHazloSanoProducts(
    page: number,
    pageSize: number,
  ): Promise<PaginatedPostsResult> {
    return this.getPaginatedPosts(HAZLO_SANO_PRODUCTS_WHERE, page, pageSize);
  }

  async getPostsByCategory(
    categoryKeys: readonly string[],
    page: number,
    pageSize: number,
    near: Coordinates | null = null,
  ): Promise<PaginatedPostsResult> {
    // Una clave desconocida llega aquí como lista vacía. Un `IN ()` es un error de sintaxis en
    // Postgres, así que se corta antes de consultar: sin resultados es la respuesta correcta.
    if (categoryKeys.length === 0) return emptyPage(page);

    const keys = sql.join(
      categoryKeys.map((key) => sql`${key}`),
      sql`, `,
    );

    // Una categoría es catálogo, no feed: la pregunta es dónde comprar esto, así que ordena.
    return this.getPaginatedPosts(
      sql`(p.category IN (${keys}) OR p.sub_category IN (${keys}))`,
      page,
      pageSize,
      { near, sortByDistance: true },
    );
  }

  async getPostsBySeller(
    sellerId: string,
    page: number,
    pageSize: number,
    options?: { includeSoldOut?: boolean },
  ): Promise<PaginatedPostsResult> {
    // Un anuncio no se agota, así que el filtro solo aplica a los productos.
    const availability = options?.includeSoldOut
      ? sql`TRUE`
      : sql`(p.kind <> ${PRODUCT_KIND} OR p.is_available)`;

    return this.getPaginatedPosts(
      sql`p.seller_id = ${sellerId}::uuid AND ${availability}`,
      page,
      pageSize,
    );
  }

  async getPostsByUser(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedPostsResult> {
    return this.getPaginatedPosts(sql`p.user_id = ${userId}`, page, pageSize);
  }

  async getTotalPosts(): Promise<number> {
    const raw = await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM posts
    `);
    const row = raw.rows[0] as { count: number };
    return Number(row.count);
  }

  async getProductCountsByOrigin(): Promise<OriginCount[]> {
    const raw = await db.execute(sql`
      SELECT p.origin, COUNT(*)::int AS count
      FROM posts p
      WHERE p.kind = ${PRODUCT_KIND}
      GROUP BY p.origin
    `);
    const rows = raw.rows as unknown as Array<{
      origin: string | null;
      count: number;
    }>;

    return rows.map((row) => ({
      origin: row.origin,
      count: Number(row.count),
    }));
  }

  /**
   * Cuántas traducciones de producto tienen vector y cuántas no. Se cuenta sobre
   * `post_translations` porque el vector vive por idioma: un producto traducido al inglés sin
   * indexar sigue siendo un hueco, aunque su versión en español ya esté indexada.
   */
  async getProductIndexingCounts(): Promise<IndexingCounts> {
    const raw = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE t.embedding IS NOT NULL)::int AS indexed,
        COUNT(*) FILTER (WHERE t.embedding IS NULL)::int     AS pending
      FROM post_translations t
      JOIN posts p ON p.id = t.post_id
      WHERE p.kind = ${PRODUCT_KIND}
    `);
    const row = raw.rows[0] as { indexed: number; pending: number };

    return { indexed: Number(row.indexed), pending: Number(row.pending) };
  }

  /**
   * Consulta paginada de posts con sus traducciones, media y autor. El `where` se recibe
   * como fragmento para que cada listado (todos, productos de Hazlo Sano, …) reutilice
   * exactamente la misma proyección y paginación.
   */
  /**
   * Las publicaciones más parecidas a una, por su vector.
   *
   * El parecido lo calcula la base con el operador de distancia de pgvector (`<=>`) sobre
   * `post_translations.embedding`, el **mismo** vector con el que el chatbot busca: si el catálogo
   * ya sabe que un suero se parece a un jugo verde, la web no tiene por qué averiguarlo otra vez.
   *
   * Se piden más de las que se van a pintar porque el dominio todavía descarta lo agotado
   * (`pickRelated`), y se excluye la propia publicación aquí para no gastar una de esas plazas.
   * Sin vector no hay parecido que ordenar: devuelve vacío en vez de caer a "las más recientes",
   * que sería recomendar cualquier cosa disfrazada de recomendación.
   */
  async getRelatedPosts(
    postId: string,
    locale: string,
    fallbackLocale: string,
    limit: number,
  ): Promise<PostData[]> {
    const raw = await db.execute(sql`
      /* La semilla se busca por post_id, no por slug.
         Con el slug, pedir la ficha en un idioma cuya fila aun no existe dejaba la referencia
         vacia y el CROSS JOIN devolvia cero filas: el bloque de relacionadas desaparecia entero.
         Prefiere el vector del idioma pedido y, si no lo hay, usa cualquiera del mismo post: el
         parecido semantico no cambia con el idioma, que es justo la gracia del embedding. */
      WITH referencia AS (
        SELECT post_id, embedding
        FROM post_translations
        WHERE post_id = ${postId} AND embedding IS NOT NULL
        ORDER BY (locale = ${locale}) DESC
        LIMIT 1
      ),
      /* Un vector por publicacion vecina: el del idioma pedido si existe, si no el de respaldo.
         Sin el DISTINCT ON, una publicacion con dos traducciones entraria dos veces. */
      vecinas AS (
        SELECT DISTINCT ON (post_id) post_id, embedding
        FROM post_translations
        WHERE embedding IS NOT NULL
          AND locale IN (${locale}, ${fallbackLocale})
        ORDER BY post_id, (locale = ${locale}) DESC
      )
      SELECT ${POST_COLUMNS}
      ${POST_JOINS}
      JOIN vecinas v ON v.post_id = p.id
      CROSS JOIN referencia r
      WHERE p.id <> r.post_id
      ORDER BY v.embedding <=> r.embedding
      LIMIT ${limit}
    `);

    return this.toPostData(raw.rows as unknown as PostRow[]);
  }

  private async getPaginatedPosts(
    where: SQL,
    page: number,
    pageSize: number,
    options: ListingOptions = {},
  ): Promise<PaginatedPostsResult> {
    const offset = (page - 1) * pageSize;
    const near = options.near ?? null;

    const raw = await db.execute(sql`
      SELECT ${POST_COLUMNS},
        ${distanceColumn(near)},
        COUNT(*) OVER()::int AS total_count
      ${POST_JOINS}
      WHERE ${where}
      ORDER BY ${orderClause(near, options.sortByDistance ?? false)}
      LIMIT ${pageSize} OFFSET ${offset}
    `);
    const rows = raw.rows as unknown as PostRow[];

    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

    if (rows.length === 0) {
      return {
        posts: [],
        nextPage: null,
        prevPage: page > 1 ? page - 1 : 1,
        total,
        totalPages: 0,
      };
    }

    const postData: PostData[] = this.toPostData(rows);

    return {
      posts: postData,
      nextPage: total > page * pageSize ? page + 1 : null,
      prevPage: page === 1 ? 1 : page - 1,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** De filas de la base a la forma que consumen las tarjetas. */
  private toPostData(rows: PostRow[]): PostData[] {
    return rows.map((row) => {
      const translations: Record<
        string,
        { title: string; slug: string; content: string }
      > = {};
      const translationsArr = Array.isArray(row.translations)
        ? row.translations
        : [];
      for (const t of translationsArr) {
        if (t.locale) {
          translations[t.locale] = {
            title: t.title ?? "",
            slug: t.slug ?? "",
            content: t.content ?? "",
          };
        }
      }

      const mediaArr: Array<{ url: string; type: string; alt?: string }> = [];
      const rawMedia = Array.isArray(row.media) ? row.media : [];
      for (const m of rawMedia) {
        if (m.url) {
          mediaArr.push({
            url: m.url,
            type: m.type ?? "image",
            alt: m.alt ?? undefined,
          });
        }
      }

      return {
        id: row.id,
        user: {
          id: row.user_id,
          name: row.user_name ?? undefined,
          email: row.user_email ?? undefined,
          image: row.user_image ?? undefined,
        },
        price: row.price ? Number(row.price) : null,
        kind: row.kind ?? undefined,
        origin: row.origin ?? null,
        category: row.category ?? null,
        subCategory: row.sub_category ?? null,
        isAvailable: row.is_available,
        contactInfo: {
          phone: row.contact_phone ?? "",
          email: row.contact_email ?? undefined,
          whatsapp: row.contact_whatsapp ?? undefined,
        },
        translations,
        media: mediaArr,
        distanceMeters:
          row.distance_meters === null || row.distance_meters === undefined
            ? null
            : Number(row.distance_meters),
        createdAt: row.created_at,
      };
    });
  }
}
