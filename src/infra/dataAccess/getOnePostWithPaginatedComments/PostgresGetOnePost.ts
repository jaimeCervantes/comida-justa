import { sql } from "drizzle-orm";
import {
  resolveModerationReason,
  resolveModerationStatus,
} from "~/domain/entities/post/moderation";
import { COMMENTS_PAGE_SIZE } from "~/infra/constants";
import { db } from "~/infra/dataAccess/db/connection";
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
  user_username: string | null;
  seller_slug: string | null;
  seller_name: string | null;
  seller_logo_url: string | null;
  price: string | null;
  kind: string | null;
  origin: string | null;
  category: string | null;
  sub_category: string | null;
  is_available: boolean;
  moderation_status: string | null;
  moderation_reason: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  created_at: Date;
  media: Array<{
    url: string;
    type: string;
    alt: string | null;
    width: number | null;
    height: number | null;
  }>;
  translations: Record<
    string,
    { title: string; slug: string; content: string }
  > | null;
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
      u.username AS user_username,
      s.slug AS seller_slug,
      s.name AS seller_name,
      /* El logo viaja con la tienda desde el slice 8: la ficha lo pinta junto al nombre, arriba,
         donde se decide. La columna existe desde el slice 6; solo faltaba pedirla aquí. */
      s.logo_url AS seller_logo_url,
      p.price::text,
      p.kind,
      p.origin,
      p.category,
      p.sub_category,
      p.is_available,
      /* La ficha NO filtra por estado: es la única pantalla que su autor y el admin tienen que
         poder abrir cuando está bajada, con el aviso de por qué. Quién puede verla lo decide
         canBeViewedBy en la página, que es quien sabe quién está mirando. */
      p.moderation_status,
      p.moderation_reason,
      p.contact_phone,
      p.contact_email,
      p.contact_whatsapp,
      p.created_at,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'url',    pm.url,
              'type',   pm.type,
              'alt',    pm.alt,
              -- Nulas en los videos y en lo publicado antes de medir. Sin ellas la ficha declaraba
              -- cuadrada cualquier foto, que es justo lo que la migracion 0030 vino a evitar.
              'width',  pm.width,
              'height', pm.height
            )
            ORDER BY pm.sort_order
          )
          FROM post_media pm
          WHERE pm.post_id = p.id
        ),
        '[]'::jsonb
      ) AS media,
      /* TODAS las traducciones del post, no solo aquella cuyo slug se pidio.
         Antes devolvia una sola y la archivaba bajo 'es' pasara lo que pasara, asi que entrar por
         la direccion inglesa traia el texto ingles etiquetado como espanol: el respaldo se
         calculaba mal y alternates.languages no se declaraba nunca. */
      COALESCE(
        (
          SELECT jsonb_object_agg(
            tr.locale,
            jsonb_build_object(
              'title',   tr.title,
              'slug',    tr.slug,
              'content', tr.content
            )
          )
          FROM post_translations tr
          WHERE tr.post_id = p.id
        ),
        '{}'::jsonb
      ) AS translations,
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
    /* Quién la vende y quién la publicó: son los dos enlaces que sacan al visitante de esta
       página hacia el resto del catálogo. Ambos LEFT: una publicación puede no tener tienda, y
       su autor puede no haber reclamado su dirección. */
    LEFT JOIN sellers s
      ON s.id = p.seller_id
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
    username: row.user_username ?? undefined,
  };

  const mediaArr = (Array.isArray(row.media) ? row.media : [])
    .filter((m) => m.url)
    .map((m) => ({
      url: m.url,
      type: m.type ?? "image",
      alt: m.alt ?? undefined,
      width: m.width,
      height: m.height,
    }));

  const commentsArr = (Array.isArray(row.comments) ? row.comments : []).map(
    (c) => ({
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
    }),
  );

  return {
    id: row.id,
    translations: row.translations ?? {},
    createdAt: row.created_at,
    user,
    seller:
      row.seller_slug && row.seller_name
        ? {
            handle: row.seller_slug,
            name: row.seller_name,
            logoUrl: row.seller_logo_url,
          }
        : null,
    price: row.price ? Number(row.price) : null,
    kind: row.kind ?? "anuncio",
    origin: row.origin ?? null,
    category: row.category ?? null,
    subCategory: row.sub_category ?? null,
    isAvailable: row.is_available,
    moderationStatus: resolveModerationStatus(row.moderation_status),
    moderationReason: resolveModerationReason(row.moderation_reason),
    media: mediaArr,
    contactInfo: {
      phone: row.contact_phone ?? "",
      email: row.contact_email ?? undefined,
      whatsapp: row.contact_whatsapp ?? undefined,
    },
    comments: commentsArr,
  };
}
