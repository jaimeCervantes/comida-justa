import { describe, expect, it } from "vitest";
import { buildLocalizedAlternates } from "./alternates";

const BASE = "https://hazlosano.com";

const nosotros = { es: "/nosotros", en: "/en/about" };

const alternatesFor = (locale: string, pathByLocale = nosotros) =>
  buildLocalizedAlternates({
    baseUrl: BASE,
    pathByLocale,
    locale,
    defaultLocale: "es",
  });

describe("buildLocalizedAlternates", () => {
  // Corrida de escritorio: cada idioma es canónico de sí mismo, no del español.
  it.each([
    ["es", `${BASE}/nosotros`],
    ["en", `${BASE}/en/about`],
  ])("en %s el canónico es %s", (locale, canonical) => {
    expect(alternatesFor(locale).canonical).toBe(canonical);
  });

  it.each(["es", "en"])(
    "desde %s declara las dos direcciones y x-default en español",
    (locale) => {
      expect(alternatesFor(locale).languages).toEqual({
        es: `${BASE}/nosotros`,
        en: `${BASE}/en/about`,
        "x-default": `${BASE}/nosotros`,
      });
    },
  );

  it("resuelve el home sin dejar la barra colgando", () => {
    const alternates = alternatesFor("es", { es: "/", en: "/en" });

    expect(alternates.canonical).toBe(`${BASE}/`);
    expect(alternates.languages).toMatchObject({ "x-default": `${BASE}/` });
  });

  it("no duplica la barra cuando la base trae una al final", () => {
    const alternates = buildLocalizedAlternates({
      baseUrl: `${BASE}/`,
      pathByLocale: nosotros,
      locale: "es",
      defaultLocale: "es",
    });

    expect(alternates.canonical).toBe(`${BASE}/nosotros`);
  });

  it("cae al idioma por defecto si el servido no tiene dirección declarada", () => {
    const alternates = buildLocalizedAlternates({
      baseUrl: BASE,
      pathByLocale: { es: "/nosotros" },
      locale: "en",
      defaultLocale: "es",
    });

    expect(alternates.canonical).toBe(`${BASE}/nosotros`);
    expect(alternates.languages).not.toHaveProperty("en");
  });
});
