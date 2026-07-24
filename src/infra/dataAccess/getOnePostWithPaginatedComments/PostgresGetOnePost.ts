import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { COMMENTS_PAGE_SIZE } from "~/infra/constants";
import type { PostUser } from "~/infra/types/Posts";

interface PostRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  user_image: string | null;
  price: string | null;
  kind: string | null;
  origin: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  created_at: Date;
  media: Array<{ url: string; type: string; alt: string | null }>;
  comments: Array<{
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    user_name: string | null;
    user_email: string | null;
    user_image: string | null;
  }> | null;
}

export async function getPostBySlug(slug: string) {
  const raw = await db.execute(sql`
    SELECT
      p.id,
      pt.title,
      pt.slug,
      pt.content,
      p.user_id,
      u.name  AS user_name,
      u.email AS user_email,
      u.image AS user_image,
      p.price::text,
      p.kind,
      p.origin,
      p.contact_phone,
      p.contact_email,
      p.contact_whatsapp,
      p.created_at,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'url',  pm.url,
              'type', pm.type,
              'alt',  pm.alt
            )
            ORDER BY pm.sort_order
          )
          FROM post_media pm
          WHERE pm.post_id = p.id
        ),
        '[]'::jsonb
      ) AS media,
      COALESCE(
        (
          SELECT jsonb_agg(data)
          FROM (
            SELECT jsonb_build_object(
              'id',         c.id,
              'content',    c.content,
              'created_at', c.created_at,
              'user_id',    cu.id,
              'user_name',  cu.name,
              'user_email', cu.email,
              'user_image', cu.image
            ) AS data
            FROM comments c
            LEFT JOIN users cu ON cu.id = c.user_id
            WHERE c.post_id = p.id
            ORDER BY c.created_at DESC
            LIMIT ${COMMENTS_PAGE_SIZE}
          ) limited
        ),
        '[]'::jsonb
      ) AS comments
    FROM posts p
    JOIN post_translations pt
      ON pt.post_id = p.id
      AND pt.slug = ${slug}
    LEFT JOIN users u
      ON u.id = p.user_id
    LIMIT 1
  `);

  const rows = raw.rows as unknown as PostRow[];

  if (rows.length === 0) {
    return { error: true, errorMessage: "No se encontró el post" };
  }

  const row = rows[0];
  const user: PostUser = {
    id: row.user_id,
    name: row.user_name ?? undefined,
    email: row.user_email ?? undefined,
    image: row.user_image ?? undefined,
  };

  const mediaArr = (Array.isArray(row.media) ? row.media : [])
    .filter((m) => m.url)
    .map((m) => ({
      url: m.url,
      type: m.type ?? "image",
      alt: m.alt ?? undefined,
    }));

  const commentsArr = (Array.isArray(row.comments) ? row.comments : [])
    .map((c) => ({
      id: c.id,
      postId: row.id,
      content: c.content,
      createdAt: new Date(c.created_at),
      user: {
        id: c.user_id,
        name: c.user_name ?? undefined,
        email: c.user_email ?? undefined,
        image: c.user_image ?? undefined,
      },
    }));

  return {
    id: row.id,
    translations: {
      es: {
        title: row.title ?? "",
        slug: row.slug ?? "",
        content: row.content ?? "",
      },
    },
    createdAt: row.created_at,
    user,
    price: row.price ? Number(row.price) : null,
    kind: row.kind ?? "anuncio",
    origin: row.origin ?? null,
    media: mediaArr,
    contactInfo: {
      phone: row.contact_phone ?? "",
      email: row.contact_email ?? undefined,
      whatsapp: row.contact_whatsapp ?? undefined,
    },
    comments: commentsArr,
  };
}
