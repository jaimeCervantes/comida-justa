import { describe, expect, it } from "vitest";
import { pillarHref } from "~/i18n/routes";
import { CANONICAL_URL } from "~/infra/constants";
import { type AlternateHref, localizedAlternates } from "./alternates";

/** La base sale de la misma constante que usa la implementación: aquí se comprueban las rutas. */
const url = (path: string): string => `${CANONICAL_URL}${path}`;

/**
 * Corrida de escritorio de las direcciones reales: es la comprobación de que `pathnames` traduce
 * lo que decimos que traduce. Si alguien renombra un segmento en `routing.ts`, aquí se ve.
 */
describe("localizedAlternates", () => {
  it.each([
    ["/" as AlternateHref, "/", "/en"],
    ["/nosotros" as AlternateHref, "/nosotros", "/en/about"],
    ["/productos" as AlternateHref, "/productos", "/en/products"],
    [
      {
        pathname: "/categoria/[key]",
        params: { key: "panaderia" },
      } as AlternateHref,
      "/categoria/panaderia",
      "/en/category/panaderia",
    ],
    [pillarHref("sueno"), "/pilares/sueno", "/en/pillars/sueno"],
    [
      pillarHref("alimentacion"),
      "/pilares/alimentacion",
      "/en/pillars/alimentacion",
    ],
    [pillarHref("movimiento"), "/pilares/movimiento", "/en/pillars/movimiento"],
    [
      pillarHref("mente-espiritu"),
      "/pilares/mente-espiritu",
      "/en/pillars/mente-espiritu",
    ],
    [
      {
        pathname: "/tienda/[slug]",
        params: { slug: "hazlo-sano" },
      } as AlternateHref,
      "/tienda/hazlo-sano",
      "/en/store/hazlo-sano",
    ],
  ])("declara la pareja de %j", (href, esPath, enPath) => {
    expect(localizedAlternates(href, "es")).toEqual({
      canonical: url(esPath),
      languages: {
        es: url(esPath),
        en: url(enPath),
        "x-default": url(esPath),
      },
    });
  });

  it("desde el inglés el canónico es el inglés, no el español", () => {
    const alternates = localizedAlternates("/nosotros", "en");

    expect(alternates).toMatchObject({
      canonical: url("/en/about"),
      languages: { "x-default": url("/nosotros") },
    });
  });

  it("resuelve la portada de los pilares, que es un catch-all sin segmento", () => {
    expect(
      localizedAlternates(
        { pathname: "/pilares/[[...slug]]", params: { slug: [] } },
        "es",
      ),
    ).toMatchObject({ canonical: url("/pilares") });
  });
});
