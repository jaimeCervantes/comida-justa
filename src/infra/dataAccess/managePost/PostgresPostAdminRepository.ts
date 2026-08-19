import { sql } from "drizzle-orm";
import type { PostMediaFile } from "~/domain/entities/post/types";
import { db } from "~/infra/dataAccess/db/connection";
import { postMedia } from "~/infra/dataAccess/db/schema/posts";
import type IPostAdminRepository from "~/use_cases/managePost/ports/IPostAdminRepository";
import type {
  EditablePost,
  PostContentUpdate,
} from "~/use_cases/managePost/ports/IPostAdminRepository";

/** La transacción que abre `db.transaction`, sin tener que nombrar los genéricos de Drizzle. */
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface MediaRow {
  url: string;
  type: string;
  alt: string | null;
  width: number | null;
  height: number | null;
}

/**
 * Deja `post_media` valiendo exactamente lo que trae la edición.
 *
 * **Se reemplaza el conjunto en vez de calcular un diff.** Un diff necesitaría una identidad estable
 * por archivo, y lo único que las dos partes comparten es la URL de Cloud Storage; con ella, mover
 * dos archivos de sitio se vería igual que borrarlos y volverlos a crear. Reemplazar es seguro
 * porque **nada apunta a `post_media.id`**: el carrito, los pedidos y el bot leen por `post_id` con
 * `ORDER BY sort_order LIMIT 1`, así que ninguna fila de otra tabla se queda huérfana al rehacerlas.
 *
 * El `sort_order` se asigna por posición **después** de filtrar, igual que al publicar: la posición
 * es la de la publicación, no la del array que llegó, y un hueco no debe dejar un salto.
 */
async function replaceMedia(
  tx: Transaction,
  update: PostContentUpdate,
): Promise<void> {
  await tx.execute(
    sql`DELETE FROM post_media WHERE post_id = ${update.postId}`,
  );

  const files = update.media.filter((file) => file?.url);

  if (files.length === 0) return;

  await tx.insert(postMedia).values(
    files.map((file, index) => ({
      postId: update.postId,
      url: file.url,
      type: file.type ?? "image",
      alt: file.alt ?? null,
      sortOrder: index,
      width: file.width ?? null,
      height: file.height ?? null,
    })),
  );
}

interface EditableRow {
  id: string;
  owner_id: string;
  slug: string;
  locale: string;
  title: string;
  content: string;
  contact_phone: string | null;
  price: string | null;
  kind: string | null;
  origin: string | null;
  category: string | null;
  sub_category: string | null;
  starts_at: Date | null;
  ends_at: Date | null;
  duration_minutes: number | null;
  is_available: boolean;
  [key: string]: unknown;
}

/**
 * Lecturas y escrituras de administración de una publicación.
 *
 * Va aparte del repositorio de creación porque responde otra pregunta: no "cómo nace una
 * publicación" sino "qué puede cambiar su dueño". En particular trae el `user_id` como `ownerId`,
 * que es lo que el caso de uso necesita para autorizar.
 */
export class PostgresPostAdminRepository implements IPostAdminRepository {
  async findBySlug(slug: string): Promise<EditablePost | null> {
    return this.findOne(sql`t.slug = ${slug}`);
  }

  async findById(postId: string): Promise<EditablePost | null> {
    return this.findOne(sql`p.id = ${postId}`);
  }

  async setAvailability(postId: string, isAvailable: boolean): Promise<void> {
    await db.execute(sql`
      UPDATE posts SET is_available = ${isAvailable} WHERE id = ${postId}
    `);
  }

  /**
   * El `slug` queda fuera del `UPDATE` a propósito: la dirección ya se compartió y moverla
   * dejaría muertos los enlaces repartidos.
   *
   * Los archivos van **dentro de la misma transacción** que el texto. Separarlos dejaría el hueco
   * en el que una publicación se queda sin ninguno: entre el `DELETE` y el `INSERT` no hay portada
   * que enseñar, y la tarjeta, el carrito y el bot leen esa fila con `ORDER BY sort_order LIMIT 1`.
   */
  async updateContent(update: PostContentUpdate): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.execute(sql`
        UPDATE posts
        SET price        = ${update.price},
            contact_phone = ${update.contactPhone},
            origin       = ${update.origin},
            category     = ${update.category},
            sub_category = ${update.subCategory},
            starts_at    = ${update.startsAt},
            ends_at      = ${update.endsAt},
            duration_minutes = ${update.durationMinutes}
        WHERE id = ${update.postId}
      `);

      await tx.execute(sql`
        UPDATE post_translations
        SET title   = ${update.title},
            content = ${update.content}
        WHERE post_id = ${update.postId} AND locale = ${update.locale}
      `);

      await replaceMedia(tx, update);
    });
  }

  private async findOne(
    where: ReturnType<typeof sql>,
  ): Promise<EditablePost | null> {
    const result = await db.execute(sql`
      SELECT
        p.id,
        p.user_id AS owner_id,
        t.slug,
        t.locale,
        t.title,
        t.content,
        p.contact_phone,
        p.price::text,
        p.kind,
        p.origin,
        p.category,
        p.sub_category,
        p.starts_at,
        p.ends_at,
        p.duration_minutes,
        p.is_available
      FROM posts p
      JOIN post_translations t ON t.post_id = p.id
      WHERE ${where}
      LIMIT 1
    `);

    const rows = result.rows as unknown as EditableRow[];

    if (rows.length === 0) return null;

    const row = rows[0];

    return {
      media: await this.readMedia(row.id),
      id: row.id,
      ownerId: row.owner_id,
      slug: row.slug,
      locale: row.locale,
      title: row.title,
      content: row.content,
      contactPhone: row.contact_phone,
      price: row.price === null ? null : Number(row.price),
      kind: row.kind ?? "anuncio",
      origin: row.origin,
      category: row.category,
      subCategory: row.sub_category,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      durationMinutes: row.duration_minutes,
      isAvailable: row.is_available,
    };
  }

  /**
   * Los archivos de la publicación, en su orden.
   *
   * En su propia consulta y no en un `JOIN` con la de arriba: unir multiplicaría la fila de la
   * publicación por cada archivo, y habría que volver a plegarla —el mismo trabajo, hecho a mano y
   * con un `LIMIT 1` que de pronto significaría otra cosa—. Son dos preguntas distintas sobre la
   * misma publicación y se hacen por separado.
   */
  private async readMedia(postId: string): Promise<PostMediaFile[]> {
    const result = await db.execute(sql`
      SELECT url, type, alt, width, height
      FROM post_media
      WHERE post_id = ${postId}
      ORDER BY sort_order
    `);

    return (result.rows as unknown as MediaRow[]).map((row) => ({
      url: row.url,
      type: row.type,
      alt: row.alt ?? undefined,
      width: row.width,
      height: row.height,
    }));
  }
}
