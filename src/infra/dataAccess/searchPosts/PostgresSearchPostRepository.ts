import { and, inArray, sql } from "drizzle-orm";
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

/**
 * Qué diccionario usa Postgres para analizar cada idioma.
 *
 * `spanish` y `english` son configuraciones que la base ya trae —se comprobó— y hacen lematización
 * y normalización de acentos por su cuenta: con ellas, `panes` y `pán` encuentran lo mismo que
 * `pan` **sin instalar `unaccent`**, que habría sido un cambio en la base compartida. Un idioma sin
 * diccionario cae en `simple`, que solo parte por espacios: peor que tener uno, mejor que fallar.
 */
const TEXT_SEARCH_CONFIG: Readonly<Record<string, string>> = {
  es: "spanish",
  en: "english",
};

function configFor(locale: string): string {
  return TEXT_SEARCH_CONFIG[locale] ?? "simple";
}

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
    fallbackLocale: string = "es",
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }> {
    const trimmed = query?.trim() ?? "";
    const { matches, total } = trimmed
      ? await this.rankedMatches(
          trimmed,
          page,
          pageSize,
          locale,
          fallbackLocale,
          near,
        )
      : await this.newestFirst(page, pageSize, near);

    if (matches.length === 0) return { results: [], total };

    return {
      results: await this.hydrate(matches, locale, fallbackLocale),
      total,
    };
  }

  async searchByVector(
    embedding: readonly number[],
    page: number,
    pageSize: number,
    locale: string,
    fallbackLocale: string,
    maxDistance: number,
    near: Coordinates | null = null,
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }> {
    const { matches, total } = await this.semanticMatches(
      embedding,
      page,
      pageSize,
      locale,
      fallbackLocale,
      maxDistance,
      near,
    );

    if (matches.length === 0) return { results: [], total };

    return {
      results: await this.hydrate(matches, locale, fallbackLocale),
      total,
    };
  }

  /**
   * Los resultados de una búsqueda, ordenados y paginados **en la base**.
   *
   * Antes no había `ORDER BY` en ninguna parte: se traían todos los IDs coincidentes, se cortaban
   * en memoria y un `sort` final restauraba ese mismo orden arbitrario. El orden real era el que
   * devolviera el planner, así que dos búsquedas idénticas podían repartir los mismos resultados
   * distinto entre las páginas.
   *
   * El criterio es la **relevancia**, que ya no son dos niveles («coincide el título» o «solo el
   * texto») sino la que calcula `ts_rank` sobre un vector con pesos: el título entra como `A` y el
   * cuerpo como `B`. Eso conserva la regla de que el título manda **y** añade lo que los dos
   * niveles no podían distinguir — coincidir una vez no es lo mismo que coincidir cinco. Después la
   * fecha, y al final el `id`: sin ese último desempate, dos publicaciones con el mismo
   * `created_at` vuelven a quedar en orden indefinido, que es justo el fallo que se corrigió.
   *
   * Y ya no es `ILIKE '%término%'`, que emparejaba subcadenas: «pan» encontraba «panela» y
   * «Pancakes», mientras que «panes» y «pán» no encontraban nada. Ver
   * `docs/features/busqueda-semantica.md`.
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
    fallbackLocale: string,
    near: Coordinates | null,
  ): Promise<{ matches: RankedMatch[]; total: number }> {
    const offset = Math.max(0, (page - 1) * pageSize);

    /* Cada fila se analiza con el diccionario de **su** idioma, no con el de quien busca: una fila
       española se lematiza en español aunque la consulta venga de la interfaz en inglés. Y la
       pregunta se construye con ese mismo diccionario, o el término quedaría partido de una forma
       y el documento de otra. */
    const rowConfig = sql`(CASE WHEN t.locale = ${locale} THEN ${configFor(locale)} ELSE ${configFor(fallbackLocale)} END)::regconfig`;

    /* `setweight` es lo que sustituye al viejo «coincide el título (0) o solo el texto (1)». El
       peso vive en el vector, así que `ts_rank` ya devuelve la relevancia con el título por delante
       —y además distingue entre coincidir una vez y coincidir cinco, que los dos niveles no podían. */
    const document = sql`(
      setweight(to_tsvector(${rowConfig}, coalesce(t.title, '')), 'A') ||
      setweight(to_tsvector(${rowConfig}, coalesce(t.content, '')), 'B')
    )`;
    const question = sql`websearch_to_tsquery(${rowConfig}, ${query})`;

    /* `IN (pedido, respaldo)` es el slice 2: antes era `= locale` a secas, así que una publicación
       sin traducción al idioma de la interfaz era **invisible** al buscar, aunque su ficha se
       abriera perfectamente. En inglés eso significaba cero resultados para todo el catálogo. */
    const searchable = sql`t.post_id = p.id AND t.locale IN (${locale}, ${fallbackLocale})`;

    const raw = await db.execute(sql`
      SELECT
        p.id,
        ${distanceColumn(near)} AS distance_meters,
        COUNT(*) OVER()::int AS total_count,
        (
          SELECT MAX(ts_rank(${document}, ${question}))
          FROM post_translations t
          WHERE ${searchable}
        ) AS relevance
      FROM posts p
      WHERE EXISTS (
        SELECT 1 FROM post_translations t
        WHERE ${searchable} AND ${document} @@ ${question}
      )
      ORDER BY
        relevance DESC,
        distance_meters ASC NULLS LAST,
        p.created_at DESC,
        p.id
      LIMIT ${pageSize} OFFSET ${offset}
    `);

    return toMatches(raw.rows as unknown as RankedRow[]);
  }

  /**
   * El rescate semántico: lo más parecido al **sentido** de la consulta.
   *
   * Solo se usa cuando el texto completo no encontró nada, así que su coste —una llamada al
   * proveedor de embeddings— se paga exactamente cuando quien busca se iba a ir con las manos
   * vacías. Ver `SearchPostsUseCase`.
   *
   * **No reusa `search_posts_semantic`**, y esa fue una decisión medida, contra lo que el roadmap
   * suponía. Esa función es el recomendador de **productos** del chatbot: filtra `kind = producto`,
   * así que dejaría fuera las 10 publicaciones de tipo `anuncio` —los artículos—, que son
   * justamente las que alguien encuentra buscando por concepto. Medido con "algo para dormir
   * mejor": la función devuelve "Suero natural" a 0.419, y la consulta directa devuelve "La clave
   * para dormir profundo" a 0.285.
   *
   * `DISTINCT ON` toma la traducción **más cercana** de cada publicación, sin importar su idioma:
   * el vector no entiende de fronteras, así que una consulta en español puede encontrar una fila
   * inglesa y al revés. Es una ventaja, no un descuido.
   */
  private async semanticMatches(
    embedding: readonly number[],
    page: number,
    pageSize: number,
    locale: string,
    fallbackLocale: string,
    maxDistance: number,
    near: Coordinates | null,
  ): Promise<{ matches: RankedMatch[]; total: number }> {
    const offset = Math.max(0, (page - 1) * pageSize);
    const vector = `[${embedding.join(",")}]`;

    const raw = await db.execute(sql`
      WITH vecinas AS (
        SELECT DISTINCT ON (post_id)
               post_id,
               (embedding <=> ${vector}::vector) AS dist
        FROM post_translations
        WHERE embedding IS NOT NULL
          AND locale IN (${locale}, ${fallbackLocale})
        ORDER BY post_id, (embedding <=> ${vector}::vector)
      )
      SELECT
        p.id,
        ${distanceColumn(near)} AS distance_meters,
        COUNT(*) OVER()::int AS total_count
      FROM posts p
      JOIN vecinas v ON v.post_id = p.id
      WHERE v.dist <= ${maxDistance}
      ORDER BY v.dist ASC, p.id
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
    fallbackLocale: string,
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
            /* Los dos idiomas, no solo el pedido: un resultado encontrado por su fila española
               mientras se navega en inglés se quedaba sin traducción que pintar, y la tarjeta salía
               sin título. Quien elige cuál se enseña es `resolvePostTranslation`. */
            inArray(postTranslations.locale, [locale, fallbackLocale]),
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

    /* Un registro **por idioma** y no una sola traducción: ahora llegan hasta dos filas por
       publicación y un `Map` plano se quedaba con la última, que es la que devolviera el planner.
       Cuál se enseña lo decide `resolvePostTranslation` al pintar la tarjeta. */
    const translationsByPost = new Map<
      string,
      Record<string, { title: string; slug: string; content: string }>
    >();
    for (const row of translationRows) {
      const current = translationsByPost.get(row.postId) ?? {};
      current[row.locale] = {
        title: row.title,
        slug: row.slug,
        content: row.content,
      };
      translationsByPost.set(row.postId, current);
    }

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

      const translations = translationsByPost.get(id) ?? {};
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
          translations,
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
