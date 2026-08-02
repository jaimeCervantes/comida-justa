import { describe, expect, it } from "vitest";
import { COMMUNITY_ITEMS, VISIBLE_COMMUNITY_ITEMS } from "./menuItems";

/** Las seis rutas que hoy llaman a `notFound()`. Se publica una quitándola de aquí. */
const STUB_PATHNAMES = [
  "/habitos/[[...slug]]",
  "/salud-infantil/[[...slug]]",
  "/medio-ambiente/[[...slug]]",
  "/productores-locales/[[...slug]]",
  "/negocios-locales/[[...slug]]",
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
    // La lista es el plan (ver docs/features/secciones-comunidad.md); borrarla sería perderlo.
    expect(COMMUNITY_ITEMS).toHaveLength(6);
  });
});
