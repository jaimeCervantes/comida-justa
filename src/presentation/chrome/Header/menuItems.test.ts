import { describe, expect, it } from "vitest";
import {
  activeMenuSection,
  COMMUNITY_ITEMS,
  type MenuSection,
  VISIBLE_COMMUNITY_ITEMS,
} from "./menuItems";

/** Las seis rutas que hoy llaman a `notFound()`. Se publica una quitándola de aquí. */
const STUB_PATHNAMES = [
  "/habitos/[[...slug]]",
  "/salud-infantil/[[...slug]]",
  "/medio-ambiente/[[...slug]]",
  "/deportes/[[...slug]]",
];

describe("las secciones de Comunidad", () => {
  it("no pinta en el menú ninguna sección que responda 404", () => {
    const visibles = VISIBLE_COMMUNITY_ITEMS.map((item) => item.href.pathname);

    for (const pathname of visibles) {
      expect(
        STUB_PATHNAMES,
        `${pathname} está en el menú pero sigue siendo un stub`,
      ).not.toContain(pathname);
    }
  });

  it("conserva las seis en la lista: se ocultan, no se borran", () => {
    // La lista es el plan (ver docs/features/community/001-2026-08-02-secciones-comunidad.md); borrarla sería perderlo.
    expect(COMMUNITY_ITEMS).toHaveLength(6);
  });
});

/**
 * Slice 2 de `docs/features/platform/007-2026-08-21-chrome-v2.md`.
 *
 * Se prueba contra la **plantilla interna**, que es lo que devuelve `usePathname` de
 * `~/i18n/navigation`: `/categoria/[key]` tanto para `/categoria/jugos` como para
 * `/en/category/jugos`. Por eso la regla no se escribe dos veces, una por idioma.
 */
describe("la sección activa del menú", () => {
  it.each<[string, MenuSection, string]>([
    ["/", "community", "«Publicaciones», su primera entrada"],
    ["/productos", "community", "entrada del desplegable"],
    ["/productos/page/[page]", "community", "la misma sección, paginada"],
    ["/eventos", "community", "entrada del desplegable"],
    ["/categoria/[key]", "community", "«Por categoría»"],
    ["/categoria/[key]/page/[page]", "community", "la misma, paginada"],
    ["/page/[page]", "community", "el inicio, paginado"],
    ["/productores-locales/[[...slug]]", "community", "sección publicada"],
    ["/negocios-locales/[[...slug]]", "community", "sección publicada"],
    ["/pilares/[[...slug]]", "pillars", "la portada y los cuatro"],
    ["/nosotros", "about", "enlace suelto de la barra"],
  ])("marca %s como %s (%s)", (pathname, esperada) => {
    expect(activeMenuSection(pathname)).toBe(esperada);
  });

  /*
   * `null` es una respuesta legítima y frecuente. La píldora dice "estás en esta sección del menú",
   * no "esto se le parece": una ficha de publicación o una tienda no están en el menú.
   */
  it.each([
    ["/buscar", "la búsqueda no es una sección del menú"],
    ["/carrito", "ni el carrito"],
    ["/publicar", "ni publicar"],
    ["/[slug]", "una publicación no está en el menú"],
    ["/tienda/[slug]", "una tienda tampoco"],
  ])("no marca nada en %s: %s", (pathname) => {
    expect(activeMenuSection(pathname)).toBeNull();
  });

  /*
   * Marcar "estás aquí" en una sección que el menú esconde sería señalar una puerta cerrada: las
   * cuatro que siguen siendo stubs responden 404.
   */
  it("no marca las secciones de Comunidad que aún no se publican", () => {
    const ocultas = COMMUNITY_ITEMS.filter((item) => !item.published);

    expect(ocultas.length).toBeGreaterThan(0);
    for (const item of ocultas) {
      expect(
        activeMenuSection(item.href.pathname),
        `${item.href.pathname} está oculta en el menú pero se marca como activa`,
      ).toBeNull();
    }
  });

  /* Y la otra mitad: todo lo que el menú sí enlaza tiene que poder marcarse. */
  it("marca todas las secciones de Comunidad que sí se publican", () => {
    for (const item of VISIBLE_COMMUNITY_ITEMS) {
      expect(activeMenuSection(item.href.pathname)).toBe("community");
    }
  });
});
