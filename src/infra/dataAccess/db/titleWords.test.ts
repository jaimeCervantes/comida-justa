import type { SQL } from "drizzle-orm";
import { sql as raw } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { firstWordFirst, titleHasAllWords } from "./titleWords";

function toQuery(fragment: SQL) {
  return new PgDialect().sqlToQuery(fragment);
}

/**
 * El filtro por palabras de la tienda y del inventario. Lo que importa de verdad —que «madr canel»
 * encuentre el pan— lo prueba `busquedaEnTienda.spec.ts` contra la base; aquí, que lo escrito
 * llegue a la consulta ya partido y doblado, y siempre como parámetro.
 */
describe("titleWords", () => {
  // Sin término el orden queda intacto: un `TRUE DESC` sería una constante, y Postgres la rechaza.
  it("sin término no filtra ni reordena", () => {
    expect(toQuery(titleHasAllWords("")).sql).toBe("TRUE");
    expect(toQuery(firstWordFirst("   ", raw`t.title ASC`)).sql).toBe(
      "t.title ASC",
    );
  });

  it("pide cada palabra por separado, ya doblada", () => {
    const { sql, params } = toQuery(titleHasAllWords("Canela  MASA canela"));

    expect(sql.match(/strpos/g)).toHaveLength(2);
    expect(params).toEqual(expect.arrayContaining(["canela", "masa"]));
  });

  it("dobla la ñ y los acentos como el dominio", () => {
    const { params } = toQuery(titleHasAllWords("Piña proteína"));

    expect(params).toEqual(expect.arrayContaining(["pina", "proteina"]));
  });

  // Un `%` escrito es ese carácter: `strpos` no tiene comodines que escapar.
  it("lo escrito nunca entra en el texto de la consulta", () => {
    const { sql } = toQuery(titleHasAllWords("90% _soya"));

    expect(sql).not.toContain("soya");
    expect(sql).not.toContain("90%");
  });

  it("el orden mira solo la primera palabra, al principio del título, y luego el de la lista", () => {
    const { sql, params } = toQuery(
      firstWordFirst("proteina soya", raw`t.title ASC`),
    );

    expect(sql).toMatch(/= 1\s*\) DESC, t\.title ASC$/);
    expect(params).toContain("proteina");
    expect(params).not.toContain("soya");
  });
});
