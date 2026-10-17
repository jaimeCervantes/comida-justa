import { type SQL, sql } from "drizzle-orm";

/**
 * Las letras que se doblan, una a una con su reemplazo: la versión SQL de `foldForSearch`.
 *
 * `translate` y no `unaccent()`: la extensión no está instalada en la base compartida, y `translate`
 * es `IMMUTABLE`. Las dos cadenas miden lo mismo: cada letra de la primera se cambia por la de la
 * misma posición. `sqlFold.test.ts` comprueba que dan lo mismo que el dominio.
 */
export const FOLD_FROM = "áàäâãéèëêíìïîóòöôõúùüûñç";
export const FOLD_TO = "aaaaaeeeeiiiiooooouuuunc";

/** Una columna como se compara al buscar: minúsculas y sin acentos, ñ ni ü. */
export function sqlFold(column: SQL): SQL {
  return sql`translate(lower(${column}), ${FOLD_FROM}, ${FOLD_TO})`;
}
