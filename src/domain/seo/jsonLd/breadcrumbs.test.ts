import { describe, expect, it } from "vitest";
import { buildBreadcrumbJsonLd } from "./breadcrumbs";
import type { JsonLdNode } from "./types";

const BASE = "https://hazlosano.com";

describe("buildBreadcrumbJsonLd", () => {
  it("numera los pasos desde el inicio hasta la página actual", () => {
    const node = buildBreadcrumbJsonLd([
      { name: "Inicio", url: `${BASE}/` },
      { name: "Alimentación", url: `${BASE}/categoria/alimentacion` },
      { name: "Panadería", url: `${BASE}/categoria/panaderia` },
    ]);

    expect(node).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Inicio",
          item: `${BASE}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Alimentación",
          item: `${BASE}/categoria/alimentacion`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Panadería",
          item: `${BASE}/categoria/panaderia`,
        },
      ],
    });
  });

  it("deja sin enlace el último paso cuando es la página que se está viendo", () => {
    const node = buildBreadcrumbJsonLd([
      { name: "Inicio", url: `${BASE}/` },
      { name: "Jugo Verde" },
    ]);
    const [, actual] = (node as JsonLdNode).itemListElement as Array<
      Record<string, unknown>
    >;

    expect(actual).not.toHaveProperty("item");
    expect(actual).toMatchObject({ position: 2, name: "Jugo Verde" });
  });

  it("no declara una miga de un solo paso, que no añade nada a la URL", () => {
    expect(buildBreadcrumbJsonLd([{ name: "Inicio", url: BASE }])).toBeNull();
    expect(buildBreadcrumbJsonLd([])).toBeNull();
  });
});
