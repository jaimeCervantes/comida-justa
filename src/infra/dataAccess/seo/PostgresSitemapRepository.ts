import { sql } from "drizzle-orm";
import type { SitemapContent } from "~/domain/seo/sitemap";
import { db } from "~/infra/dataAccess/db/connection";

/**
 * Todo lo que hay que publicar en el sitemap, en una sola ida a la base.
 *
 * Se piden solo las columnas que el sitemap usa —dirección y fecha—, y **solo la traducción
 * `es`**: es el único idioma en el que existe el contenido, y `/en/<slug>` sería la misma página
 * duplicada.
 */
export async function getSitemapContent(): Promise<SitemapContent> {
  const [posts, stores, profiles] = await Promise.all([
    db.execute(sql`
      SELECT t.slug, p.created_at
      FROM post_translations t
      JOIN posts p ON p.id = t.post_id
      WHERE t.locale = 'es'
      ORDER BY p.created_at DESC
    `),
    db.execute(sql`
      SELECT slug, created_at
      FROM sellers
      WHERE slug IS NOT NULL
      ORDER BY created_at DESC
    `),
    db.execute(sql`
      SELECT username
      FROM users
      WHERE username IS NOT NULL
      ORDER BY username
    `),
  ]);

  return {
    posts: (
      posts.rows as unknown as Array<{ slug: string; created_at: Date | null }>
    ).map((row) => ({ slug: row.slug, lastModified: row.created_at })),
    stores: (
      stores.rows as unknown as Array<{ slug: string; created_at: Date | null }>
    ).map((row) => ({ handle: row.slug, lastModified: row.created_at })),
    profiles: (profiles.rows as unknown as Array<{ username: string }>).map(
      (row) => ({ username: row.username }),
    ),
  };
}
