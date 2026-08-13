import { describe, expect, it } from "vitest";
import { getPathname } from "./navigation";
import { PILLARS_OVERVIEW_HREF, pillarHref } from "./routes";

describe("PILLARS_OVERVIEW_HREF", () => {
  it("resuelve la portada sin segmento y traduce la ruta, no el slug", () => {
    expect(getPathname({ locale: "es", href: PILLARS_OVERVIEW_HREF })).toBe(
      "/pilares",
    );
    expect(getPathname({ locale: "en", href: PILLARS_OVERVIEW_HREF })).toBe(
      "/en/pillars",
    );
  });
});

describe("pillarHref", () => {
  it.each([
    ["sueno", "/pilares/sueno", "/en/pillars/sueno"],
    ["alimentacion", "/pilares/alimentacion", "/en/pillars/alimentacion"],
    ["movimiento", "/pilares/movimiento", "/en/pillars/movimiento"],
    ["mente-espiritu", "/pilares/mente-espiritu", "/en/pillars/mente-espiritu"],
  ] as const)(
    "resolves %s without translating its stable slug",
    (slug, es, en) => {
      const href = pillarHref(slug);

      expect(getPathname({ locale: "es", href })).toBe(es);
      expect(getPathname({ locale: "en", href })).toBe(en);
    },
  );
});
