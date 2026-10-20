import { type SQL, sql } from "drizzle-orm";
import { searchWords } from "~/domain/search/searchWords";
import { sqlFold } from "./sqlFold";

/**
 * Que **todas** las palabras estén en el título, en cualquier orden y aunque sea a medias.
 *
 * `strpos` y no `LIKE`: un `%` o un `_` escritos son ese carácter, no comodines, y así no hay nada
 * que escapar.
 */
export function containsAllWords(title: SQL, words: readonly string[]): SQL {
  return sql.join(
    words.map((word) => sql`strpos(${sqlFold(title)}, ${word}) > 0`),
    sql` AND `,
  );
}

/**
 * El filtro por título de una lista que ya se está mirando —el catálogo de una tienda, el panel de
 * inventario—, en **cualquiera** de los idiomas de la publicación `p`.
 *
 * Lo escrito se parte con `searchWords`, el mismo del selector de la difusión: «canela masa»,
 * «madr canel» y «pina» encuentran «Pan de masa madre de canela» y «Agua de piña». Antes se buscaba
 * la frase entera tal como se escribió, y solo «masa madre» lo encontraba. Ver
 * `docs/features/search/007-2026-10-20-busqueda-en-tienda-por-palabras.md`.
 *
 * `EXISTS` y no un `JOIN`: basta que case un idioma, y no multiplica la fila.
 */
export function titleHasAllWords(term: string): SQL {
  const words = searchWords(term);
  if (words.length === 0) return sql`TRUE`;

  return sql`EXISTS (
    SELECT 1 FROM post_translations pt
    WHERE pt.post_id = p.id AND ${containsAllWords(sql`pt.title`, words)}
  )`;
}

/**
 * El `ORDER BY` de una lista con término: primero lo que tiene un título que **empieza** con la
 * primera palabra, y después `order`, el orden propio de la lista. Así «proteina» pone la proteína
 * antes que la barra de proteína, y lo demás queda como estaba.
 *
 * Sin palabras devuelve `order` tal cual: Postgres no admite una constante (`TRUE DESC`) en un
 * `ORDER BY`.
 */
export function firstWordFirst(term: string, order: SQL): SQL {
  const [first] = searchWords(term);
  if (first === undefined) return order;

  return sql`EXISTS (
    SELECT 1 FROM post_translations pt
    WHERE pt.post_id = p.id AND strpos(${sqlFold(sql`pt.title`)}, ${first}) = 1
  ) DESC, ${order}`;
}
