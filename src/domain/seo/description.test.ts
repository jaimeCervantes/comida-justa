import { describe, expect, it } from "vitest";
import { buildMetaDescription } from "./description";

describe("buildMetaDescription", () => {
  it("deja tal cual lo que ya es corto", () => {
    // El contenido real de "Jugo Verde".
    const content = "Nopal, apio, piña y perejil. Recién hecho.";

    expect(buildMetaDescription(content)).toBe(content);
  });

  it("colapsa saltos de línea y espacios repetidos del textarea", () => {
    expect(buildMetaDescription("Pan   de masa\n\nmadre.\n")).toBe(
      "Pan de masa madre.",
    );
  });

  it("corta en la última palabra completa, no a media palabra", () => {
    const description = buildMetaDescription(
      "Nopal, apio, piña y perejil recién licuados cada mañana",
      20,
    );

    expect(description).toBe("Nopal, apio, piña y…");
    expect(description).not.toContain("perej…");
  });

  it("no deja puntuación colgando antes de los puntos suspensivos", () => {
    expect(buildMetaDescription("Nopal, apio, piña y perejil", 12)).toBe(
      "Nopal, apio…",
    );
  });

  it.each([null, undefined, "", "   "])("%j da cadena vacía", (content) => {
    expect(buildMetaDescription(content)).toBe("");
  });

  it("una sola palabra larguísima se corta igual, sin quedarse en blanco", () => {
    expect(buildMetaDescription("a".repeat(300), 10)).toBe(
      `${"a".repeat(10)}…`,
    );
  });
});
