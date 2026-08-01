import { type SQL, sql } from "drizzle-orm";
import { PRODUCT_KIND } from "~/domain/entities/post/hazloSanoProduct";
import type { IndexingCounts } from "~/domain/entities/post/indexingReport";
import { HAZLO_SANO_ORIGIN_PREFIX } from "~/domain/entities/post/origin";
import type { OriginCount } from "~/domain/entities/post/originReport";
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
  total_count: number;
  [key: string]: unknown;
}

/** Publicaciones vendidas por Hazlo Sano: `kind = producto` + `origin` `hazlo_sano_*`. */
const HAZLO_SANO_PRODUCTS_WHERE: SQL = sql`p.kind = ${PRODUCT_KIND} AND p.origin LIKE ${`${HAZLO_SANO_ORIGIN_PREFIX}%`}`;

const ALL_POSTS_WHERE: SQL = sql`TRUE`;

export class PostgresPostQueryRepository implements IPostQueryRepository {
  async getMultiplePosts(
    page: number,
    pageSize: number,
  ): Promise<PaginatedPostsResult> {
    return this.getPaginatedPosts(ALL_POSTS_WHERE, page, pageSize);
  }

  async getHazloSanoProducts(
    page: number,
    pageSize: number,
  ): Promise<PaginatedPostsResult> {
    return this.getPaginatedPosts(HAZLO_SANO_PRODUCTS_WHERE, page, pageSize);
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
  private async getPaginatedPosts(
    where: SQL,
    page: number,
    pageSize: number,
  ): Promise<PaginatedPostsResult> {
    const offset = (page - 1) * pageSize;

    const raw = await db.execute(sql`
      SELECT
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
        COALESCE(m.media, '[]'::jsonb)        AS media,
        COUNT(*) OVER()::int                  AS total_count
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
      ) m ON TRUE
      WHERE ${where}
      ORDER BY p.created_at DESC
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

    const postData: PostData[] = rows.map((row) => {
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
        createdAt: row.created_at,
      };
    });

    return {
      posts: postData,
      nextPage: total > page * pageSize ? page + 1 : null,
      prevPage: page === 1 ? 1 : page - 1,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
