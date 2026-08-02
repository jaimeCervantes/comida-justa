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

describe("buildSitemap", () => {
  it("incluye las páginas fijas que existen", () => {
    const urls = buildSitemap(BASE, empty).map((entry) => entry.url);

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

    const entries = buildSitemap(BASE, {
      ...empty,
      posts: [{ slug, lastModified }],
    });

    expect(entries).toContainEqual({ url, lastModified });
  });

  it("incluye tiendas y perfiles en su propio namespace", () => {
    const urls = buildSitemap(BASE, {
      ...empty,
      stores: [{ handle: "hazlo-sano" }],
      profiles: [{ username: "jaime" }],
    }).map((entry) => entry.url);

    expect(urls).toContain(`${BASE}/tienda/hazlo-sano`);
    expect(urls).toContain(`${BASE}/u/jaime`);
  });

  it("omite la fecha cuando la base no la tiene, en vez de inventar hoy", () => {
    const [entry] = buildSitemap(BASE, {
      ...empty,
      posts: [{ slug: "jugo-verde", lastModified: null }],
    }).filter((item) => item.url.endsWith("/jugo-verde"));

    expect(entry).toEqual({ url: `${BASE}/jugo-verde` });
  });

  it("no duplica la barra si la URL base trae una al final", () => {
    const urls = buildSitemap(`${BASE}/`, {
      ...empty,
      posts: [{ slug: "jugo-verde" }],
    }).map((entry) => entry.url);

    expect(urls).toContain(`${BASE}/jugo-verde`);
    expect(urls).toContain(`${BASE}/`);
  });

  it("publica las categorías que recibe, que son las que tienen publicaciones", () => {
    const urls = buildSitemap(BASE, {
      ...empty,
      categories: [{ key: "alimentacion" }, { key: "panaderia" }],
    }).map((entry) => entry.url);

    expect(urls).toContain(`${BASE}/categoria/alimentacion`);
    expect(urls).toContain(`${BASE}/categoria/panaderia`);
  });

  it("no inventa categorías: publica exactamente las que le dan", () => {
    // Las vacías (`abarrotes`, `frutas_y_verduras`, `sueno_y_descanso`,
    // `movimiento_y_ejercicio`) no llegan hasta aquí: las filtra la consulta.
    const urls = buildSitemap(BASE, empty).map((entry) => entry.url);

    expect(urls.some((url) => url.includes("/categoria/"))).toBe(false);
  });

  it("publica las secciones que ya tienen contenido", () => {
    const urls = buildSitemap(BASE, {
      ...empty,
      sections: [{ path: "/negocios-locales" }],
    }).map((entry) => entry.url);

    expect(urls).toContain(`${BASE}/negocios-locales`);
    // La de productores no llega hasta aquí mientras nadie publique algo que elabore.
    expect(urls).not.toContain(`${BASE}/productores-locales`);
  });
});
