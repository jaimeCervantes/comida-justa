import { describe, expect, it } from "vitest";
import { availableLocales, resolvePostTranslation } from "./translations";

/**
 * Cubre los escenarios de `@slice-2` en `src/e2e/i18n/i18n.feature`.
 *
 * Datos reales: "Suero natural" es una de las 24 publicaciones que hoy existen en
 * `post_translations`, todas con `locale = 'es'` y ninguna en inglés.
 */
const ES = {
  locale: "es",
  title: "Suero natural",
  slug: "suero-natural",
  content: "Bebida fermentada de la casa.",
};
const EN = {
  locale: "en",
  title: "Natural whey",
  slug: "natural-whey",
  content: "House fermented drink.",
};

describe("resolvePostTranslation", () => {
  it("devuelve el idioma pedido cuando existe", () => {
    const resolved = resolvePostTranslation({ es: ES, en: EN }, "en", "es");

    expect(resolved).toMatchObject({
      locale: "en",
      title: "Natural whey",
      slug: "natural-whey",
      isFallback: false,
    });
  });

  /* El caso de hoy: las 24 publicaciones solo tienen `es`, así que pedir inglés cae al español. */
  it("cae al idioma de respaldo y lo declara", () => {
    const resolved = resolvePostTranslation({ es: ES }, "en", "es");

    expect(resolved).toMatchObject({ locale: "es", title: "Suero natural" });
    expect(resolved?.isFallback).toBe(true);
  });

  /**
   * El respaldo no puede ser un silencio: quien pinta necesita poder decir "esto está en español"
   * y quien genera el SEO necesita saber que no debe declarar una versión inglesa que no existe.
   */
  it("marca el respaldo aunque el texto se vea idéntico al pedido", () => {
    const soloEspanol = resolvePostTranslation({ es: ES }, "en", "es");
    const enEspanol = resolvePostTranslation({ es: ES }, "es", "es");

    expect(soloEspanol?.title).toBe(enEspanol?.title);
    expect(soloEspanol?.isFallback).toBe(true);
    expect(enEspanol?.isFallback).toBe(false);
  });

  it("usa cualquier idioma disponible antes que no enseñar nada", () => {
    const resolved = resolvePostTranslation(
      { fr: { ...ES, locale: "fr", title: "Petit-lait" } },
      "en",
      "es",
    );

    expect(resolved).toMatchObject({ locale: "fr", isFallback: true });
  });

  it.each([
    ["sin traducciones", undefined],
    ["nulo", null],
    ["vacío", {}],
    ["con una fila sin texto", { en: { locale: "en", slug: "x" } }],
  ])("devuelve null %s", (_caso, translations) => {
    expect(resolvePostTranslation(translations, "en", "es")).toBeNull();
  });

  /* Una fila con slug pero sin título ni contenido no es una traducción, es una fila a medias:
     enseñarla dejaría la ficha con el encabezado en blanco. */
  it("no considera usable una fila que solo tiene slug", () => {
    const resolved = resolvePostTranslation(
      { en: { locale: "en", slug: "natural-whey" }, es: ES },
      "en",
      "es",
    );

    expect(resolved?.locale).toBe("es");
    expect(resolved?.isFallback).toBe(true);
  });
});

describe("availableLocales", () => {
  it("lista solo los idiomas con texto de verdad", () => {
    expect(
      availableLocales({ es: ES, en: { locale: "en", slug: "natural-whey" } }),
    ).toEqual(["es"]);
  });

  it("lista los dos cuando ambos existen", () => {
    expect(availableLocales({ es: ES, en: EN }).sort()).toEqual(["en", "es"]);
  });

  it.each([
    ["sin traducciones", undefined],
    ["nulo", null],
  ])("devuelve una lista vacía %s", (_caso, translations) => {
    expect(availableLocales(translations)).toEqual([]);
  });
});
