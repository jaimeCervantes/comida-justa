import { describe, expect, it } from "vitest";
import { type AppLocale, resolveLocale, routing } from "./routing";

describe("resolveLocale", () => {
  it.each<[string | undefined, AppLocale]>([
    ["es", "es"],
    ["en", "en"],
    ["fr", "es"],
    ["", "es"],
    [undefined, "es"],
  ])("convierte el segmento %o en el idioma %s", (segment, expected) => {
    expect(resolveLocale(segment)).toBe(expected);
  });

  it("cae al idioma por omisión declarado en el enrutado, no a un literal", () => {
    expect(resolveLocale("fr")).toBe(routing.defaultLocale);
  });
});
