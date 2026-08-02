import { describe, expect, it } from "vitest";
import { buildLlmsTxt } from "./llmsTxt";

const BASE = "https://hazlosano.com";

const input = {
  baseUrl: BASE,
  brandName: "Hazlo Sano",
  description: "Lo que publica y vende la comunidad para comer sano.",
  sections: [
    {
      heading: "Publicaciones",
      entries: [
        {
          title: "Jugo Verde",
          path: "/jugo-verde",
          summary: "Nopal, apio, piña y perejil.",
        },
        { title: "Suero natural", path: "/suero-natural", summary: null },
      ],
    },
    {
      heading: "Tiendas",
      entries: [{ title: "Hazlo Sano", path: "/tienda/hazlo-sano" }],
    },
  ],
};

describe("buildLlmsTxt", () => {
  it("empieza por el nombre del sitio y una cita que dice qué es", () => {
    const [primera, , tercera] = buildLlmsTxt(input).split("\n");

    expect(primera).toBe("# Hazlo Sano");
    expect(tercera).toBe(
      "> Lo que publica y vende la comunidad para comer sano.",
    );
  });

  it("lista cada entrada como un enlace absoluto con su resumen", () => {
    expect(buildLlmsTxt(input)).toContain(
      `- [Jugo Verde](${BASE}/jugo-verde): Nopal, apio, piña y perejil.`,
    );
  });

  it("omite el resumen de lo que no tiene texto, sin dejar los dos puntos", () => {
    expect(buildLlmsTxt(input)).toContain(
      `- [Suero natural](${BASE}/suero-natural)\n`,
    );
  });

  it("agrupa por sección con su encabezado", () => {
    const salida = buildLlmsTxt(input);

    expect(salida).toContain("## Publicaciones");
    expect(salida).toContain("## Tiendas");
  });

  it("no imprime el encabezado de una sección vacía", () => {
    const salida = buildLlmsTxt({
      ...input,
      sections: [{ heading: "Perfiles", entries: [] }],
    });

    expect(salida).not.toContain("## Perfiles");
  });

  it("acorta los resúmenes largos en la última palabra completa", () => {
    const salida = buildLlmsTxt({
      ...input,
      sections: [
        {
          heading: "Publicaciones",
          entries: [
            {
              title: "Crema de almendras",
              path: "/crema",
              summary: `${"palabra ".repeat(40)}final`,
            },
          ],
        },
      ],
    });
    const linea = salida
      .split("\n")
      .find((line) => line.startsWith("- [Crema"));

    expect(linea?.length).toBeLessThan(180);
    expect(linea).toContain("…");
    expect(linea).not.toContain("palabr…");
  });

  it("termina con un solo salto de línea", () => {
    const salida = buildLlmsTxt(input);

    expect(salida.endsWith("\n")).toBe(true);
    expect(salida.endsWith("\n\n")).toBe(false);
  });
});
