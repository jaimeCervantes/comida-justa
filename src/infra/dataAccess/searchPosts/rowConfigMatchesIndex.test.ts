import { describe, expect, it } from "vitest";
import { FTS_INDEXED_DOCUMENTS } from "./PostgresSearchPostRepository";

/**
 * Los índices `ix_translations_fts_<locale>` y el filtro de la consulta tienen que decir lo mismo,
 * palabra por palabra.
 *
 * Postgres usa un índice de expresión **solo** cuando la expresión de la consulta es idéntica a la
 * indexada. Si se desalinean no falla nada: los índices siguen ahí, la búsqueda sigue devolviendo
 * lo correcto, y simplemente vuelve al recorrido secuencial. Con 46 traducciones no se nota; con
 * 46.000 sí, y para entonces nadie recordará que estas dos cosas iban atadas.
 *
 * La copia de la migración se transcribe aquí a mano **a propósito**. El archivo de Alembic vive en
 * OTRO repositorio (`bot-whatsapp/backend`), así que leerlo haría que el test pasara solo porque
 * los dos lados cambiaron a la vez — que es justo lo que no queremos permitir sin mirar. Si este
 * test falla, la respuesta casi nunca es cambiar la constante de abajo: es escribir la migración
 * que recrea los índices con la expresión nueva.
 */
const INDEXED = {
  es:
    "setweight(to_tsvector('spanish', coalesce(title, '')), 'A') || " +
    "setweight(to_tsvector('spanish', coalesce(content, '')), 'B')",
  en:
    "setweight(to_tsvector('english', coalesce(title, '')), 'A') || " +
    "setweight(to_tsvector('english', coalesce(content, '')), 'B')",
} as const;

describe("El documento indexado por idioma", () => {
  it("cubre exactamente los idiomas que la migración 0029_2026_08_08 indexa", () => {
    expect(Object.keys(FTS_INDEXED_DOCUMENTS).sort()).toEqual(
      Object.keys(INDEXED).sort(),
    );
  });

  /* El alias es lo único que puede diferir: el índice se declara sobre la tabla (`title`) y la
     consulta la recorre con alias (`t.title`). Postgres las empareja porque apuntan a la misma
     columna; lo que no perdona es que cambie la expresión. */
  it.each(Object.keys(INDEXED) as Array<keyof typeof INDEXED>)(
    "coincide con `ix_translations_fts_%s`",
    (locale) => {
      const withoutAlias = FTS_INDEXED_DOCUMENTS[locale].replaceAll("t.", "");

      expect(withoutAlias).toBe(INDEXED[locale]);
    },
  );

  /* El diccionario va como literal y no como parámetro: `$1` nunca es idéntico a `'spanish'`, así
     que con marcadores los índices existirían y no se usarían nunca. */
  it.each(Object.entries(INDEXED))(
    "inlinea el diccionario de %s en vez de pasarlo como parámetro",
    (locale) => {
      expect(FTS_INDEXED_DOCUMENTS[locale as "es" | "en"]).not.toMatch(/\$\d/);
    },
  );
});
