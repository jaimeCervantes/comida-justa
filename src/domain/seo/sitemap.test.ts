import { describe, expect, it } from "vitest";
import { buildSitemap, STATIC_SITEMAP_PATHS } from "./sitemap";

const BASE = "https://hazlosano.com";

const empty = {
  posts: [],
  stores: [],
  profiles: [],
  categories: [],
  sections: [],
};

/**
 * Fija el idioma por defecto una vez.
 *
 * Estas pruebas llamaban a `buildSitemap` con dos argumentos y publicaban posts sin `locale`, y
 * seguían en verde **por accidente**: `undefined === undefined` daba «este es el idioma por
 * defecto» y la URL salía sin prefijo. `tsconfig.json` excluye los tests del typecheck, así que
 * añadir un parámetro requerido no rompió nada hasta que alguien lo miró.
 */
const buildSitemapEs = (
  baseUrl: string,
  content: Parameters<typeof buildSitemap>[1],
) => buildSitemap(baseUrl, content, "es");

describe("buildSitemap", () => {
  it("incluye las páginas fijas que existen", () => {
    const urls = buildSitemap(BASE, empty, "es").map((entry) => entry.url);

    expect(urls).toContain(`${BASE}/`);
    expect(urls).toContain(`${BASE}/productos`);
    expect(urls).toContain(`${BASE}/nosotros`);
    expect(urls).toContain(`${BASE}/pilares/alimentacion`);
    expect(urls).toHaveLength(STATIC_SITEMAP_PATHS.length);
  });

  it.each([
    "/deportes",
    "/habitos",
    "/medio-ambiente",
    "/negocios-locales",
    "/salud-infantil",
    "/productores-locales",
  ])("no incluye %s, que hoy responde 404", (path) => {
    expect(STATIC_SITEMAP_PATHS).not.toContain(path);
  });

  it.each(["/cuenta", "/publicar", "/editar", "/admin", "/buscar", "/search"])(
    "no incluye %s, que no es contenido público",
    (path) => {
      expect(STATIC_SITEMAP_PATHS).not.toContain(path);
    },
  );

  // Corrida de escritorio del escenario @component: publicaciones reales del catálogo.
  it.each([
    ["jugo-verde", "2026-07-25", `${BASE}/jugo-verde`],
    ["suero-natural", "2026-07-25", `${BASE}/suero-natural`],
  ])("publica %j como %s", (slug, fecha, url) => {
    const lastModified = new Date(fecha);

    const entries = buildSitemapEs(BASE, {
      ...empty,
      posts: [{ slug, locale: "es", lastModified }],
    });

    expect(entries).toContainEqual({ url, lastModified });
  });

  it("incluye tiendas y perfiles en su propio namespace", () => {
    const urls = buildSitemapEs(BASE, {
      ...empty,
      stores: [{ handle: "hazlo-sano" }],
      profiles: [{ username: "jaime" }],
    }).map((entry) => entry.url);

    expect(urls).toContain(`${BASE}/tienda/hazlo-sano`);
    expect(urls).toContain(`${BASE}/u/jaime`);
  });

  it("omite la fecha cuando la base no la tiene, en vez de inventar hoy", () => {
    const [entry] = buildSitemapEs(BASE, {
      ...empty,
      posts: [{ slug: "jugo-verde", locale: "es", lastModified: null }],
    }).filter((item) => item.url.endsWith("/jugo-verde"));

    expect(entry).toEqual({ url: `${BASE}/jugo-verde` });
  });

  it("no duplica la barra si la URL base trae una al final", () => {
    const urls = buildSitemapEs(`${BASE}/`, {
      ...empty,
      posts: [{ slug: "jugo-verde", locale: "es" }],
    }).map((entry) => entry.url);

    expect(urls).toContain(`${BASE}/jugo-verde`);
    expect(urls).toContain(`${BASE}/`);
  });

  it("publica las categorías que recibe, que son las que tienen publicaciones", () => {
    const urls = buildSitemapEs(BASE, {
      ...empty,
      categories: [{ key: "alimentacion" }, { key: "panaderia" }],
    }).map((entry) => entry.url);

    expect(urls).toContain(`${BASE}/categoria/alimentacion`);
    expect(urls).toContain(`${BASE}/categoria/panaderia`);
  });

  it("no inventa categorías: publica exactamente las que le dan", () => {
    // Las vacías (`abarrotes`, `frutas_y_verduras`, `sueno_y_descanso`,
    // `movimiento_y_ejercicio`) no llegan hasta aquí: las filtra la consulta.
    const urls = buildSitemap(BASE, empty, "es").map((entry) => entry.url);

    expect(urls.some((url) => url.includes("/categoria/"))).toBe(false);
  });

  it("publica las secciones que ya tienen contenido", () => {
    const urls = buildSitemapEs(BASE, {
      ...empty,
      sections: [{ path: "/negocios-locales" }],
    }).map((entry) => entry.url);

    expect(urls).toContain(`${BASE}/negocios-locales`);
    // La de productores no llega hasta aquí mientras nadie publique algo que elabore.
    expect(urls).not.toContain(`${BASE}/productores-locales`);
  });
});

describe("buildSitemap y los idiomas", () => {
  const empty2 = {
    posts: [],
    stores: [],
    profiles: [],
    categories: [],
    sections: [],
  };

  /* El español vive sin prefijo (`localePrefix: as-needed`) y el inglés bajo `/en`. Cada idioma
     tiene su propio slug, así que son dos páginas distintas y no una duplicada. */
  it("lista cada traducción en su propia dirección", () => {
    const urls = buildSitemap(
      BASE,
      {
        ...empty2,
        posts: [
          { slug: "suero-natural", locale: "es" },
          { slug: "natural-electrolyte-drink", locale: "en" },
        ],
      },
      "es",
    ).map((entry) => entry.url);

    expect(urls).toContain(`${BASE}/suero-natural`);
    expect(urls).toContain(`${BASE}/en/natural-electrolyte-drink`);
  });

  it("no inventa un prefijo para el idioma por defecto", () => {
    const [entry] = buildSitemap(
      BASE,
      { ...empty2, posts: [{ slug: "jugo-verde", locale: "es" }] },
      "es",
    ).filter((item) => item.url.includes("jugo-verde"));

    expect(entry.url).toBe(`${BASE}/jugo-verde`);
    expect(entry.url).not.toContain("/es/");
  });

  it("respeta otro idioma por defecto sin tocar el código", () => {
    const urls = buildSitemap(
      BASE,
      {
        ...empty2,
        posts: [
          { slug: "suero-natural", locale: "es" },
          { slug: "natural-electrolyte-drink", locale: "en" },
        ],
      },
      "en",
    ).map((entry) => entry.url);

    expect(urls).toContain(`${BASE}/natural-electrolyte-drink`);
    expect(urls).toContain(`${BASE}/es/suero-natural`);
  });
});
