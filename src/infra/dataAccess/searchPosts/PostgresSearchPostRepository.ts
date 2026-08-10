import { inArray, sql } from "drizzle-orm";
import type { PostMediaFile } from "~/domain/entities/post/types";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";
import {
  postMedia,
  posts,
  postTranslations,
} from "~/infra/dataAccess/db/schema/posts";
import { sellers } from "~/infra/dataAccess/db/schema/sellers";
import type { ISearchPostResultDTO } from "~/use_cases/searchPosts/dtos/ISearchPostResultDTO";
import type { ISearchPostRepository } from "~/use_cases/searchPosts/ports/ISearchPostRepository";

/**
 * Lo mínimo para pintar una tienda en una tarjeta y llegar a ella.
 *
 * Se declara aquí y no se importa de `presentation/identity/StoreIdentity` porque `infra` no puede
 * depender de la capa de presentación. Es la misma forma que ya declara `PostData.seller` en
 * `IPostQueryRepository`, por el mismo motivo.
 */
type SearchStoreIdentity = {
  handle: string;
  name: string;
  logoUrl?: string | null;
};

/**
 * La tienda de una publicación, o `null` cuando no hay a dónde enlazar.
 *
 * **Sin `slug` no existe para quien pinta**, igual que en el catálogo: una tienda a medio dar de
 * alta no debe salir como un logo que no lleva a ninguna parte.
 */
function toStoreIdentity(
  seller:
    | { name: string; slug: string | null; logoUrl: string | null }
    | undefined,
): SearchStoreIdentity | null {
  if (!seller?.slug) return null;

  return { handle: seller.slug, name: seller.name, logoUrl: seller.logoUrl };
}

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

/** El diccionario de un idioma que no tiene el suyo: parte por espacios y no lematiza nada. */
const NEUTRAL_CONFIG = "simple";

/**
 * Nada de lo que se inlinea sale de una petición —son claves del mapa de arriba— pero se comprueba
 * igual: al emitirse como literal SQL y no como parámetro, una entrada rara en el mapa dejaría de
 * ser un dato para pasar a ser sintaxis.
 */
const SAFE_IDENTIFIER = /^[a-z][a-z0-9_]*$/;

function literal(value: string): string {
  if (!SAFE_IDENTIFIER.test(value)) {
    throw new Error(
      `TEXT_SEARCH_CONFIG: "${value}" no es un identificador que se pueda inlinear.`,
    );
  }

  return `'${value}'`;
}

/**
 * El diccionario que le toca a **cada fila**, decidido por el idioma de la fila y no por el de
 * quien busca.
 *
 * Antes esto era un `CASE` de dos ramas —tu idioma o el de respaldo— porque la consulta solo veía
 * esos dos. Al abrirla a todas las traducciones deja de haber dos casos que enumerar: se traduce el
 * mapa entero a SQL, así que añadir un idioma sigue siendo una línea en `TEXT_SEARCH_CONFIG`.
 * Analizar una fila inglesa con el diccionario español no es un detalle: `loaves` seguiría siendo
 * `loaves` y buscar `loaf` no la encontraría.
 *
 * Se usa para **puntuar**, no para filtrar. Filtrar con esto no puede aprovechar ningún índice
 * (ver `matchesQuery`), pero puntuar corre sobre las filas que el filtro ya dejó pasar, así que un
 * `CASE` ahí no cuesta nada y se lee mucho mejor que repetir la rama por idioma.
 */
const ROW_CONFIG = sql.raw(
  `CASE t.locale ${Object.entries(TEXT_SEARCH_CONFIG)
    .map(
      ([locale, config]) =>
        `WHEN ${literal(locale)} THEN ${literal(config)}::regconfig`,
    )
    .join(" ")} ELSE ${literal(NEUTRAL_CONFIG)}::regconfig END`,
);

/** El documento pesado de una fila con el diccionario ya resuelto: título `A`, cuerpo `B`. */
function weightedDocument(config: string): string {
  return (
    `setweight(to_tsvector(${config}, coalesce(t.title, '')), 'A') || ` +
    `setweight(to_tsvector(${config}, coalesce(t.content, '')), 'B')`
  );
}

/**
 * La expresión que se indexa por idioma, expuesta para que una prueba pueda compararla contra la
 * migración. No se usa en ninguna consulta: es el contrato, no el código.
 */
export const FTS_INDEXED_DOCUMENTS: Readonly<Record<string, string>> =
  Object.fromEntries(
    Object.entries(TEXT_SEARCH_CONFIG).map(([locale, config]) => [
      locale,
      weightedDocument(literal(config)),
    ]),
  );

/**
 * El filtro, **partido por idioma para que pueda usar un índice**.
 *
 * La forma corta —un solo `@@` con el `CASE` de arriba a los dos lados— es la que estaba aquí, y
 * es la que **ningún índice GIN puede servir**. No por la expresión indexada, sino por el otro
 * lado del operador: si el `tsquery` también sale de un `CASE` sobre `t.locale`, la clave de
 * búsqueda cambia de una fila a otra, y un GIN necesita una clave fija para descender por el
 * índice. Medido con `EXPLAIN` y `enable_seqscan = off`: seq scan igual, con o sin índice.
 *
 * Partida por idioma, cada rama lleva su diccionario como constante y empareja con su índice
 * parcial (`ix_translations_fts_es`, `ix_translations_fts_en`, migración Alembic
 * `0029_2026_08_08`):
 *
 *   BitmapOr
 *     → Bitmap Index Scan on ix_translations_fts_es
 *     → Bitmap Index Scan on ix_translations_fts_en
 *
 * La rama final cubre los idiomas sin diccionario propio: caen a `simple` y **no** llevan índice,
 * porque serían N índices para el caso que hoy no existe.
 *
 * **Esto y la migración van atados.** Si se desalinean no falla nada: la búsqueda sigue devolviendo
 * lo correcto y solo deja de usar el índice, en silencio. Lo vigila `rowConfigMatchesIndex.test.ts`.
 */
function matchesQuery(query: string) {
  const known = Object.keys(TEXT_SEARCH_CONFIG).map(literal).join(", ");

  const branches = Object.entries(TEXT_SEARCH_CONFIG).map(
    ([locale, config]) =>
      sql`(t.locale = ${sql.raw(literal(locale))} AND (${sql.raw(
        weightedDocument(literal(config)),
      )}) @@ websearch_to_tsquery(${sql.raw(literal(config))}, ${query}))`,
  );

  branches.push(
    sql`(t.locale NOT IN (${sql.raw(known)}) AND (${sql.raw(
      weightedDocument(literal(NEUTRAL_CONFIG)),
    )}) @@ websearch_to_tsquery(${sql.raw(literal(NEUTRAL_CONFIG))}, ${query}))`,
  );

  return sql`(${sql.join(branches, sql` OR `)})`;
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
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }> {
    const trimmed = query?.trim() ?? "";
    const { matches, total } = trimmed
      ? await this.rankedMatches(trimmed, page, pageSize, locale, near)
      : await this.newestFirst(page, pageSize, near);

    if (matches.length === 0) return { results: [], total };

    return { results: await this.hydrate(matches), total };
  }

  async searchByVector(
    embedding: readonly number[],
    page: number,
    pageSize: number,
    maxDistance: number,
    near: Coordinates | null = null,
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }> {
    const { matches, total } = await this.semanticMatches(
      embedding,
      page,
      pageSize,
      maxDistance,
      near,
    );

    if (matches.length === 0) return { results: [], total };

    return { results: await this.hydrate(matches), total };
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
   * **La búsqueda no tiene idioma; el orden sí.** Se mira **toda** traducción, no solo la del
   * idioma pedido y su respaldo: navegando en español los dos eran `es`, el filtro se cerraba sobre
   * sí mismo y las filas inglesas no entraban, así que «bread» devolvía cero aunque los tres panes
   * del catálogo se llamen «Sourdough Bread» en inglés. Lo que conserva idioma es el desempate:
   * `own_relevance` —la relevancia de tu propia fila— manda sobre `relevance`, que es la mejor de
   * cualquier idioma. Así «pan» en español devuelve exactamente lo que devolvía, y «bread» en
   * español encuentra los panes detrás. Ver `docs/features/busqueda-entre-idiomas.md`.
   *
   * `JOIN LATERAL` en vez de `EXISTS` más dos subconsultas correlacionadas: agrega, así que una
   * publicación no puede salir dos veces por tener dos traducciones que coinciden, y devuelve las
   * dos relevancias en una sola pasada. `COUNT(*) OVER()` da el total sin una segunda consulta.
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
    const offset = Math.max(0, (page - 1) * pageSize);

    /* `setweight` es lo que sustituye al viejo «coincide el título (0) o solo el texto (1)». El
       peso vive en el vector, así que `ts_rank` ya devuelve la relevancia con el título por delante
       —y además distingue entre coincidir una vez y coincidir cinco, que los dos niveles no podían.

       La pregunta se construye con el diccionario de la fila, igual que el documento: con dos
       distintos el término quedaría partido de una forma y el texto de otra.

       Esto **puntúa**; quien filtra es `matchesQuery`, que dice lo mismo partido por idioma para
       poder usar los índices parciales. Se separan porque solo el filtro necesita ser indexable:
       la puntuación corre sobre lo que el filtro ya dejó pasar. */
    const document = sql`(
      setweight(to_tsvector(${ROW_CONFIG}, coalesce(t.title, '')), 'A') ||
      setweight(to_tsvector(${ROW_CONFIG}, coalesce(t.content, '')), 'B')
    )`;
    const question = sql`websearch_to_tsquery(${ROW_CONFIG}, ${query})`;

    const raw = await db.execute(sql`
      SELECT
        p.id,
        ${distanceColumn(near)} AS distance_meters,
        COUNT(*) OVER()::int AS total_count
      FROM posts p
      JOIN LATERAL (
        SELECT
          MAX(ts_rank(${document}, ${question})) AS relevance,
          MAX(ts_rank(${document}, ${question}))
            FILTER (WHERE t.locale = ${locale}) AS own_relevance
        FROM post_translations t
        WHERE t.post_id = p.id AND ${matchesQuery(query)}
      ) r ON r.relevance IS NOT NULL
      ORDER BY
        r.own_relevance DESC NULLS LAST,
        r.relevance DESC,
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
   * inglesa y al revés. Es una ventaja, no un descuido — y por eso el `WHERE` ya no filtra por
   * idioma: lo hacía, y con ello contradecía la frase anterior. Navegando en español el filtro era
   * `IN ('es','es')` y dejaba fuera justo las filas que el vector podía aprovechar.
   */
  private async semanticMatches(
    embedding: readonly number[],
    page: number,
    pageSize: number,
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
   *
   * **Se traen todas las traducciones, sin filtrar por idioma.** Antes eran las del idioma pedido y
   * su respaldo, que bastaban mientras la búsqueda solo miraba esos dos; ahora una publicación
   * puede entrar por una fila de cualquier idioma, y filtrar aquí la dejaría sin nada que pintar
   * —una tarjeta sin título—. Son como mucho dos filas por resultado. Cuál se enseña lo decide
   * `resolvePostTranslation`, que ya sabe caer al respaldo y, si tampoco, a lo que haya.
   */
  private async hydrate(
    matches: RankedMatch[],
  ): Promise<ISearchPostResultDTO[]> {
    const ids = matches.map((match) => match.id);
    const [postRows, translationRows, mediaRows] = await Promise.all([
      db.select().from(posts).where(inArray(posts.id, ids)),
      db
        .select()
        .from(postTranslations)
        .where(inArray(postTranslations.postId, ids)),
      db
        .select()
        .from(postMedia)
        .where(inArray(postMedia.postId, ids))
        .orderBy(postMedia.sortOrder),
    ]);

    /* Las dos lecturas dependen de `postRows`, así que no podían ir en el `Promise.all` de arriba
       —pero sí una junto a la otra: son independientes entre sí y en serie costaban dos viajes. */
    const userIds = [...new Set(postRows.map((post) => post.userId))];
    const sellerIds = [
      ...new Set(
        postRows
          .map((post) => post.sellerId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [userRows, sellerRows] = await Promise.all([
      userIds.length > 0
        ? db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              image: users.image,
            })
            .from(users)
            .where(inArray(users.id, userIds))
        : [],
      sellerIds.length > 0
        ? db
            .select({
              id: sellers.id,
              name: sellers.name,
              slug: sellers.slug,
              logoUrl: sellers.logoUrl,
            })
            .from(sellers)
            .where(inArray(sellers.id, sellerIds))
        : [],
    ]);

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

    const mediaByPost = new Map<string, PostMediaFile[]>();
    for (const media of mediaRows) {
      if (!mediaByPost.has(media.postId)) mediaByPost.set(media.postId, []);
      mediaByPost.get(media.postId)?.push({
        url: media.url,
        type: media.type,
        alt: media.alt ?? undefined,
        width: media.width ?? undefined,
        height: media.height ?? undefined,
      });
    }

    const userById = new Map(userRows.map((user) => [user.id, user]));
    const sellerById = new Map(sellerRows.map((seller) => [seller.id, seller]));
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
          /**
           * Qué es y si queda: **lo que decide si se puede juntar en el carrito.**
           *
           * Faltaban aunque `row` los traía desde siempre —la consulta hace
           * `db.select().from(posts)`, o sea todas las columnas—, y el `as unknown as` de abajo
           * impedía que TypeScript avisara. Sin `kind`, `canBeOrdered` devolvía `false` para todo
           * y ni el botón de añadir ni la insignia de agotado aparecían en un resultado de
           * búsqueda, mientras la misma publicación sí los mostraba en `/productos`.
           */
          kind: row.kind,
          isAvailable: row.isAvailable,
          /* El resto de la línea de insignias, para que un resultado de búsqueda enseñe lo mismo
             que la misma publicación en `/productos`: de dónde viene, qué es y de quién es. */
          origin: row.origin ?? null,
          category: row.category ?? null,
          subCategory: row.subCategory ?? null,
          seller: toStoreIdentity(sellerById.get(row.sellerId ?? "")),
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
          /* El `as unknown as` sigue aquí por **una** discrepancia concreta y no por comodidad: el
             `Post` del dominio declara `media: PostMediaFile` en singular, mientras que todo el que
             la lee la trata como lista. Mientras ese tipo no se arregle, cualquier campo que se
             olvide aquí se pierde en silencio — que es exactamente lo que pasó con `kind` e
             `isAvailable` —y antes con `origin`, `category`, `subCategory` y `seller`—. Ya no falta
             ninguno; lo que queda es el tipo de `media`. */
        } as unknown as ISearchPostResultDTO,
      ];
    });
  }
}
