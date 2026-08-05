import { and, eq, inArray, sql } from "drizzle-orm";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
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
  distance_meters: string | null;
  total_count: number;
}

interface RankedMatch {
  id: string;
  distanceMeters: number | null;
}

/**
 * A qué distancia está la tienda de cada resultado, en metros, o `NULL`.
 *
 * Es el mismo subconsulta que usan el catálogo (`PostgresPostQueryRepository:118`) y el directorio
 * (`PostgresStoreDirectory:77`): `MIN` porque una tienda puede tener varias sucursales y decide la
 * más cercana, y correlacionada en vez de `JOIN` para que **nada desaparezca de la búsqueda por no
 * tener ubicación**.
 */
function distanceColumn(near: Coordinates | null) {
  if (!near) return sql`NULL::double precision`;

  return sql`(
    SELECT MIN(
      ST_Distance(
        b.location,
        ST_SetSRID(ST_MakePoint(${near.longitude}, ${near.latitude}), 4326)::geography
      )
    )
    FROM branches b
    WHERE b.seller_id = p.seller_id
  )`;
}

/** Las filas crudas, con el total que trae la ventana y la distancia ya en número. */
function toMatches(rows: RankedRow[]): {
  matches: RankedMatch[];
  total: number;
} {
  return {
    matches: rows.map((row) => ({
      id: row.id,
      distanceMeters:
        row.distance_meters === null || row.distance_meters === undefined
          ? null
          : Number(row.distance_meters),
    })),
    total: rows.length > 0 ? Number(rows[0].total_count) : 0,
  };
}

export class PostgresSearchPostRepository implements ISearchPostRepository {
  async search(
    query: string,
    page: number,
    pageSize: number,
    locale: string = "es",
    near: Coordinates | null = null,
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }> {
    const trimmed = query?.trim() ?? "";
    const { matches, total } = trimmed
      ? await this.rankedMatches(trimmed, page, pageSize, locale, near)
      : await this.newestFirst(page, pageSize, near);

    if (matches.length === 0) return { results: [], total };

    return { results: await this.hydrate(matches, locale), total };
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
   *
   * **La distancia desempata, no manda.** Entra después del nivel de relevancia y antes de la
   * fecha: entre dos resultados igual de pertinentes, el más cercano es más útil; pero un resultado
   * que solo coincide en el texto no adelanta a uno cuyo título coincide por estar más cerca. Esa
   * es la diferencia entre una búsqueda y un listado — en `/productos` nadie dijo qué quería, aquí
   * sí. Y no hay filtro por radio en ninguna parte: esconder algo que alguien pidió por su nombre
   * sería el peor fallo posible.
   */
  private async rankedMatches(
    query: string,
    page: number,
    pageSize: number,
    locale: string,
    near: Coordinates | null,
  ): Promise<{ matches: RankedMatch[]; total: number }> {
    const pattern = `%${query}%`;
    const offset = Math.max(0, (page - 1) * pageSize);

    const matchesTitle = sql`EXISTS (
      SELECT 1 FROM post_translations t
      WHERE t.post_id = p.id AND t.locale = ${locale} AND t.title ILIKE ${pattern}
    )`;

    const raw = await db.execute(sql`
      SELECT
        p.id,
        ${distanceColumn(near)} AS distance_meters,
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
        distance_meters ASC NULLS LAST,
        p.created_at DESC,
        p.id
      LIMIT ${pageSize} OFFSET ${offset}
    `);

    return toMatches(raw.rows as unknown as RankedRow[]);
  }

  /** Sin término no hay relevancia que medir: lo más cercano y, si no, lo más reciente. */
  private async newestFirst(
    page: number,
    pageSize: number,
    near: Coordinates | null,
  ): Promise<{ matches: RankedMatch[]; total: number }> {
    const offset = Math.max(0, (page - 1) * pageSize);

    const raw = await db.execute(sql`
      SELECT
        p.id,
        ${distanceColumn(near)} AS distance_meters,
        COUNT(*) OVER()::int AS total_count
      FROM posts p
      ORDER BY
        distance_meters ASC NULLS LAST,
        p.created_at DESC,
        p.id
      LIMIT ${pageSize} OFFSET ${offset}
    `);

    return toMatches(raw.rows as unknown as RankedRow[]);
  }

  /**
   * Los datos completos de una página de resultados, en el orden que decidió la consulta.
   *
   * `inArray` no conserva el orden —lo decide el planner otra vez—, así que se reordena contra los
   * `ids` que ya venían ordenados. Es la única ordenación en memoria que queda, y es sobre las 6
   * filas de una página, no sobre la tabla entera.
   */
  private async hydrate(
    matches: RankedMatch[],
    locale: string,
  ): Promise<ISearchPostResultDTO[]> {
    const ids = matches.map((match) => match.id);
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

    /* Se recorre `matches` y no `postRows`: el orden lo decidió la base y aquí solo se respeta. */
    return matches.flatMap(({ id, distanceMeters }) => {
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
          distanceMeters,
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
