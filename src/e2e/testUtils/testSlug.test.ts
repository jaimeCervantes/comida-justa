import { describe, it, expect } from "vitest";
import {
  TEST_CATEGORY_PREFIX,
  TEST_SLUG_PREFIX,
  isTestCategoryKey,
  isTestSlug,
  testCategoryKey,
  testPost,
  testSlug,
} from "./testSlug";

/**
 * El marcador que decide qué borra el barrido.
 *
 * Lo que importa aquí no es que reconozca lo de prueba —eso es fácil— sino que **no reconozca lo
 * real**: barrer de más sería peor que no barrer. La base que se limpia es la misma donde vive el
 * catálogo de verdad.
 */
describe("testSlug", () => {
  it("marks the slug with the agreed prefix", () => {
    expect(testSlug("miel-de-abeja")).toMatch(/^e2e-miel-de-abeja-\d+$/);
  });

  it("makes every call unique, so two scenarios never collide", () => {
    const a = testSlug("producto");
    const b = testSlug("producto");

    // Dos llamadas en el mismo milisegundo no deben producir el mismo slug.
    expect(a).not.toBe(b);
  });

  it("produces something the sweep recognises", () => {
    expect(isTestSlug(testSlug("lo-que-sea"))).toBe(true);
  });

  it("uses the prefix the sweep looks for", () => {
    expect(testSlug("x").startsWith(TEST_SLUG_PREFIX)).toBe(true);
  });
});

describe("isTestSlug", () => {
  describe.each([
    ["e2e-miel-de-abeja-1785417725068", "el prefijo acordado"],
    ["e2e-producto-de-reporte-1785417725", "cualquier nombre tras el prefijo"],
    ["e2e-", "el prefijo pelado"],
  ])("%j is test data", (slug, reason) => {
    it(`— ${reason}`, () => {
      expect(isTestSlug(slug)).toBe(true);
    });
  });

  // Lo que el barrido NO debe tocar. `miel-de-abeja-1785417725068` es exactamente la forma que
  // tenían los datos filtrados: si el marcador fuera el sufijo, borraría contenido real igual.
  describe.each([
    ["miel-de-abeja-1785417725068", "contenido real que termina en dígitos"],
    ["jugo-verde", "contenido real"],
    ["pan-de-masa-madre-natural", "contenido real"],
    ["mie2e-de-abeja", "contiene el marcador, no lo lleva de prefijo"],
    ["una-receta-e2e-casera", "el marcador va en medio"],
    ["E2E-mayusculas", "el prefijo es en minúsculas"],
    ["", "vacío"],
  ])("%j is NOT test data", (slug, reason) => {
    it(`— ${reason}`, () => {
      expect(isTestSlug(slug)).toBe(false);
    });
  });

  it.each([null, undefined])("treats %j as not test data", (value) => {
    expect(isTestSlug(value)).toBe(false);
  });
});

/**
 * El camino de `/publicar`: la prueba no elige el slug, lo deriva la app del título. Si el marcador
 * no sobreviviera a esa generación, esas publicaciones quedarían fuera del barrido — que es
 * exactamente la clase de hueco que dejó datos en la base.
 */
describe("testPost", () => {
  it("marks the title so the generated slug carries the prefix", () => {
    const { title, slug } = testPost("Ensalada griega");

    expect(title).toMatch(/^E2E Ensalada griega \d+$/);
    expect(slug).toMatch(/^e2e-ensalada-griega-\d+$/);
  });

  it("produces a slug the sweep recognises", () => {
    expect(isTestSlug(testPost("lo que sea").slug)).toBe(true);
  });

  it("survives accents, which the slug generator strips", () => {
    const { slug } = testPost("Crema de cacahuate artesanal ñandú");

    expect(isTestSlug(slug)).toBe(true);
    expect(slug).toContain("nandu");
  });

  it("gives a different slug on every call, so reruns never collide", () => {
    expect(testPost("x").slug).not.toBe(testPost("x").slug);
  });
});

describe("testCategoryKey", () => {
  // La clave de una categoría no admite guiones medios; el CHECK de la base exige guion bajo.
  it("uses an underscore, because the database rejects a hyphen", () => {
    expect(testCategoryKey("conservas")).toMatch(/^e2e_conservas_\d+$/);
  });

  it("produces something the sweep recognises", () => {
    expect(isTestCategoryKey(testCategoryKey("x"))).toBe(true);
  });

  it("matches the shape the database demands of a key", () => {
    expect(testCategoryKey("conservas")).toMatch(/^[a-z0-9]+(_[a-z0-9]+)*$/);
  });

  it("uses the prefix the sweep looks for", () => {
    expect(testCategoryKey("x").startsWith(TEST_CATEGORY_PREFIX)).toBe(true);
  });
});

describe("isTestCategoryKey", () => {
  it.each(["e2e_conservas_123", "e2e_x"])("%j is test data", (key) => {
    expect(isTestCategoryKey(key)).toBe(true);
  });

  it.each(["jugos", "alimentacion", "untables", "cremas_e2e", ""])(
    "%j is NOT test data",
    (key) => {
      expect(isTestCategoryKey(key)).toBe(false);
    },
  );
});
