import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";
import {
  postMedia,
  posts,
  postTranslations,
} from "~/infra/dataAccess/db/schema/posts";
import type { ISearchPostResultDTO } from "~/use_cases/searchPosts/dtos/ISearchPostResultDTO";
import type { ISearchPostRepository } from "~/use_cases/searchPosts/ports/ISearchPostRepository";

interface RankedRow {
  id: string;
  total_count: number;
}

export class PostgresSearchPostRepository implements ISearchPostRepository {
  async search(
    query: string,
    page: number,
    pageSize: number,
    locale: string = "es",
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }> {
    const trimmed = query?.trim() ?? "";
    const { ids, total } = trimmed
      ? await this.rankedMatches(trimmed, page, pageSize, locale)
      : await this.newestFirst(page, pageSize);

    if (ids.length === 0) return { results: [], total };

    return { results: await this.hydrate(ids, locale), total };
  }

  /**
   * Los resultados de una búsqueda, ordenados y paginados **en la base**.
   *
   * Antes no había `ORDER BY` en ninguna parte: se traían todos los IDs coincidentes, se cortaban
   * en memoria y un `sort` final restauraba ese mismo orden arbitrario. El orden real era el que
   * devolviera el planner, así que dos búsquedas idénticas podían repartir los mismos resultados
   * distinto entre las páginas.
   *
   * El criterio ahora es la **relevancia**, y solo tiene dos niveles: coincide el título (0) o
   * coincide únicamente el texto (1). Dos niveles se explican en una frase y se prueban en una
   * tabla; más —empieza por, palabra completa, coincidencia exacta— sería especular sin datos de
   * uso. Después la fecha, y al final el `id`: sin ese último desempate, dos publicaciones con el
   * mismo `created_at` vuelven a quedar en orden indefinido, que es justo el fallo que se corrige.
   *
   * `EXISTS` y no `JOIN` para que una publicación no pueda salir dos veces si algún día hay dos
   * traducciones del mismo idioma. `COUNT(*) OVER()` da el total sin una segunda consulta.
   */
  private async rankedMatches(
    query: string,
    page: number,
    pageSize: number,
    locale: string,
  ): Promise<{ ids: string[]; total: number }> {
    const pattern = `%${query}%`;
    const offset = Math.max(0, (page - 1) * pageSize);

    const matchesTitle = sql`EXISTS (
      SELECT 1 FROM post_translations t
      WHERE t.post_id = p.id AND t.locale = ${locale} AND t.title ILIKE ${pattern}
    )`;

    const raw = await db.execute(sql`
      SELECT
        p.id,
        COUNT(*) OVER()::int AS total_count
      FROM posts p
      WHERE EXISTS (
        SELECT 1 FROM post_translations t
        WHERE t.post_id = p.id
          AND t.locale = ${locale}
          AND (t.title ILIKE ${pattern} OR t.content ILIKE ${pattern})
      )
      ORDER BY
        CASE WHEN ${matchesTitle} THEN 0 ELSE 1 END,
        p.created_at DESC,
        p.id
      LIMIT ${pageSize} OFFSET ${offset}
    `);

    const rows = raw.rows as unknown as RankedRow[];

    return {
      ids: rows.map((row) => row.id),
      total: rows.length > 0 ? Number(rows[0].total_count) : 0,
    };
  }

  /** Sin término no hay relevancia que medir: lo más reciente primero, como estaba. */
  private async newestFirst(
    page: number,
    pageSize: number,
  ): Promise<{ ids: string[]; total: number }> {
    const offset = Math.max(0, (page - 1) * pageSize);

    const [rows, counted] = await Promise.all([
      db
        .select({ id: posts.id })
        .from(posts)
        .orderBy(desc(posts.createdAt), posts.id)
        .limit(pageSize)
        .offset(offset),
      db.select({ total: sql<number>`COUNT(*)::int` }).from(posts),
    ]);

    return { ids: rows.map((row) => row.id), total: counted[0]?.total ?? 0 };
  }

  /**
   * Los datos completos de una página de resultados, en el orden que decidió la consulta.
   *
   * `inArray` no conserva el orden —lo decide el planner otra vez—, así que se reordena contra los
   * `ids` que ya venían ordenados. Es la única ordenación en memoria que queda, y es sobre las 6
   * filas de una página, no sobre la tabla entera.
   */
  private async hydrate(
    ids: string[],
    locale: string,
  ): Promise<ISearchPostResultDTO[]> {
    const [postRows, translationRows, mediaRows] = await Promise.all([
      db.select().from(posts).where(inArray(posts.id, ids)),
      db
        .select()
        .from(postTranslations)
        .where(
          and(
            inArray(postTranslations.postId, ids),
            eq(postTranslations.locale, locale),
          ),
        ),
      db
        .select()
        .from(postMedia)
        .where(inArray(postMedia.postId, ids))
        .orderBy(postMedia.sortOrder),
    ]);

    const userIds = [...new Set(postRows.map((post) => post.userId))];
    const userRows =
      userIds.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              image: users.image,
            })
            .from(users)
            .where(inArray(users.id, userIds))
        : [];

    const translationByPost = new Map(
      translationRows.map((row) => [
        row.postId,
        { title: row.title, slug: row.slug, content: row.content },
      ]),
    );

    const mediaByPost = new Map<
      string,
      Array<{ url: string; type: string; alt?: string }>
    >();
    for (const media of mediaRows) {
      if (!mediaByPost.has(media.postId)) mediaByPost.set(media.postId, []);
      mediaByPost.get(media.postId)?.push({
        url: media.url,
        type: media.type,
        alt: media.alt ?? undefined,
      });
    }

    const userById = new Map(userRows.map((user) => [user.id, user]));
    const postById = new Map(postRows.map((post) => [post.id, post]));

    /* Se recorre `ids` y no `postRows`: el orden lo decidió la base y aquí solo se respeta. */
    return ids.flatMap((id) => {
      const row = postById.get(id);

      if (!row) return [];

      const translation = translationByPost.get(id);
      const user = userById.get(row.userId);

      return [
        {
          id: row.id,
          price: row.price ? Number(row.price) : null,
          contactInfo: {
            phone: row.contactPhone ?? "",
            email: row.contactEmail ?? undefined,
            whatsapp: row.contactWhatsapp ?? undefined,
          },
          translations: {
            [locale]: {
              title: translation?.title ?? "",
              slug: translation?.slug ?? "",
              content: translation?.content ?? "",
            },
          },
          media: mediaByPost.get(id) ?? [],
          user: {
            id: user?.id ?? row.userId,
            email: user?.email ?? undefined,
            name: user?.name ?? undefined,
            image: user?.image ?? undefined,
          },
          createdAt: row.createdAt,
        } as unknown as ISearchPostResultDTO,
      ];
    });
  }
}
