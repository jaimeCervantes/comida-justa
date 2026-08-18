import { sql } from "drizzle-orm";
import { PRODUCER_ORIGIN } from "~/domain/entities/post/origin";
import type { SitemapContent } from "~/domain/seo/sitemap";
import { db } from "~/infra/dataAccess/db/connection";
import { PUBLISHED_POSTS } from "~/infra/dataAccess/db/publishedPosts";

/**
 * Todo lo que hay que publicar en el sitemap, en una sola ida a la base.
 *
 * Se piden solo las columnas que el sitemap usa: dirección, idioma y fecha. **Todas las
 * traducciones**, no solo la española — desde el backfill cada idioma tiene su propio slug y su
 * propio texto, así que cada uno es una página real y no un duplicado.
 */
export async function getSitemapContent(): Promise<SitemapContent> {
  const [posts, stores, profiles, categories, sections] = await Promise.all([
    db.execute(sql`
      SELECT t.slug, t.locale, p.created_at
      FROM post_translations t
      JOIN posts p ON p.id = t.post_id
      WHERE ${PUBLISHED_POSTS}
      ORDER BY p.created_at DESC, t.locale
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
    /* Solo las categorías activas **con publicaciones**, directas o de su sub-categoría. Una
       categoría vacía responde 200 con una lista hueca, y publicarla sería ofrecerle al buscador
       una página delgada por cada clave del catálogo. Hoy pasan el filtro 6 de 10. */
    db.execute(sql`
      SELECT c.key
      FROM categories c
      WHERE c.is_active
        AND EXISTS (
          SELECT 1
          FROM posts p
          WHERE ${PUBLISHED_POSTS}
            AND (p.category = c.key OR p.sub_category = c.key)
        )
      ORDER BY c.level, c.sort_order
    `),
    /* Las dos secciones del directorio, cada una con su propia prueba de vida: negocios existe si
       hay al menos una tienda con dirección; productores, si alguien publicó algo que elabora. La
       vacía se queda fuera del sitemap y además pide `noindex` desde su propia metadata. */
    db.execute(sql`
      SELECT '/negocios-locales' AS path
      WHERE EXISTS (SELECT 1 FROM sellers WHERE slug IS NOT NULL)
      UNION ALL
      SELECT '/productores-locales' AS path
      WHERE EXISTS (
        SELECT 1 FROM posts p
        WHERE ${PUBLISHED_POSTS} AND p.origin = ${PRODUCER_ORIGIN}
      )
    `),
  ]);

  return {
    posts: (
      posts.rows as unknown as Array<{
        slug: string;
        locale: string;
        created_at: Date | null;
      }>
    ).map((row) => ({
      slug: row.slug,
      locale: row.locale,
      lastModified: row.created_at,
    })),
    stores: (
      stores.rows as unknown as Array<{ slug: string; created_at: Date | null }>
    ).map((row) => ({ handle: row.slug, lastModified: row.created_at })),
    profiles: (profiles.rows as unknown as Array<{ username: string }>).map(
      (row) => ({ username: row.username }),
    ),
    categories: (categories.rows as unknown as Array<{ key: string }>).map(
      (row) => ({ key: row.key }),
    ),
    sections: (sections.rows as unknown as Array<{ path: string }>).map(
      (row) => ({ path: row.path }),
    ),
  };
}
