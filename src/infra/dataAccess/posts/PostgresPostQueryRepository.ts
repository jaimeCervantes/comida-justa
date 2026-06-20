import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import type { IPostQueryRepository, PostData, PaginatedPostsResult } from "./IPostQueryRepository";

interface PostRow {
  id: string;
  user_id: string;
  price: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  created_at: Date;
  user_name: string | null;
  user_email: string | null;
  user_image: string | null;
  translations: Array<{ locale: string; title: string; slug: string; content: string }>;
  media: Array<{ url: string; type: string; alt: string | null }>;
  total_count: number;
  [key: string]: unknown;
}

export class PostgresPostQueryRepository implements IPostQueryRepository {
  async getMultiplePosts(
    page: number,
    pageSize: number,
  ): Promise<PaginatedPostsResult> {
    const offset = (page - 1) * pageSize;

    const raw = await db.execute(sql`
      SELECT
        p.id,
        p.user_id,
        p.price::text,
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
      ORDER BY p.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `);
    const rows = raw.rows as unknown as PostRow[];

    const total = rows.length > 0
      ? Number(rows[0].total_count)
      : 0;

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
      const translations: Record<string, { title: string; slug: string; content: string }> = {};
      const translationsArr = Array.isArray(row.translations) ? row.translations : [];
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

  async getTotalPosts(): Promise<number> {
    const raw = await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM posts
    `);
    const row = raw.rows[0] as { count: number };
    return Number(row.count);
  }
}
