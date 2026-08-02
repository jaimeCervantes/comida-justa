import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

export interface FeedPost {
  slug: string;
  title: string;
  content: string;
  createdAt: Date | null;
}

export interface DirectoryEntry {
  path: string;
  title: string;
  summary: string | null;
}

/**
 * Las publicaciones más recientes, con su texto.
 *
 * Es lo que alimenta el feed y el índice para asistentes. Se pide el contenido **recortado en la
 * base** (`LEFT`) porque de él solo sale un resumen de dos líneas: traer 2.500 caracteres por fila
 * para tirar el 95% sería pagar por nada.
 */
export async function getLatestPosts(limit: number): Promise<FeedPost[]> {
  const raw = await db.execute(sql`
    SELECT t.slug, t.title, LEFT(t.content, 400) AS content, p.created_at
    FROM post_translations t
    JOIN posts p ON p.id = t.post_id
    WHERE t.locale = 'es'
    ORDER BY p.created_at DESC
    LIMIT ${limit}
  `);

  return (
    raw.rows as unknown as Array<{
      slug: string;
      title: string;
      content: string | null;
      created_at: string | Date | null;
    }>
  ).map((row) => ({
    slug: row.slug,
    title: row.title,
    content: row.content ?? "",
    createdAt: toDate(row.created_at),
  }));
}

/**
 * `db.execute` con SQL en crudo devuelve las fechas **como texto**, no como `Date`.
 *
 * El dominio pide un `Date` —el feed necesita formatearla en RFC 822—, así que la conversión pasa
 * aquí, que es el borde. Costó un 500 en `/rss.xml` descubrirlo: el tipo decía `Date` y en tiempo
 * de ejecución era un string.
 */
function toDate(value: string | Date | null): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Las tiendas y los perfiles que existen, para el índice de asistentes. */
export async function getDirectory(): Promise<{
  stores: DirectoryEntry[];
  profiles: DirectoryEntry[];
}> {
  const [stores, profiles] = await Promise.all([
    db.execute(sql`
      SELECT slug, name, description
      FROM sellers
      WHERE slug IS NOT NULL
      ORDER BY name
    `),
    db.execute(sql`
      SELECT username, name
      FROM users
      WHERE username IS NOT NULL
      ORDER BY username
    `),
  ]);

  return {
    stores: (
      stores.rows as unknown as Array<{
        slug: string;
        name: string;
        description: string | null;
      }>
    ).map((row) => ({
      path: `/tienda/${row.slug}`,
      title: row.name,
      summary: row.description,
    })),
    profiles: (
      profiles.rows as unknown as Array<{
        username: string;
        name: string | null;
      }>
    ).map((row) => ({
      path: `/u/${row.username}`,
      title: row.name ?? row.username,
      summary: null,
    })),
  };
}
