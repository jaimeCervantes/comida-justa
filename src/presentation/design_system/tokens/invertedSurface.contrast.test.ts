import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AA_THRESHOLD, contrastRatio, readCssVariables } from "./contrast";

/**
 * La banda oscura del 5.16, medida.
 *
 * Es la superficie que **no** sigue al tema: el pie es oscuro en claro y en oscuro, a propósito. Eso
 * la deja fuera de `darkThemeParity.test.ts` —que compara los dos bloques oscuros entre sí— y sin
 * nadie que vigile sus parejas. Este archivo es ese vigilante.
 *
 * Se mide contra `--surface-inverted` y no contra un hex escrito aquí, por lo mismo que las otras
 * dos rampas: un espejo en TypeScript se desincroniza del CSS a la primera.
 */
const CSS = readFileSync(join(__dirname, "colors.css"), "utf8");

const LIGHT = readCssVariables(CSS, {
  startAfter: ":root {",
  stopAt: "@media (prefers-color-scheme: dark)",
});

const BACKGROUND = LIGHT["--surface-inverted"];

describe("La banda oscura", () => {
  it("declara su fondo una sola vez, fuera del tema", () => {
    expect(BACKGROUND).toBe("#101410");

    /* Si algún día se redeclara en un bloque oscuro, deja de ser «la banda oscura» y pasa a ser una
       superficie temática más: esta prueba es el aviso. */
    const dark = readCssVariables(CSS, {
      startAfter: "@media (prefers-color-scheme: dark) {",
      stopAt: "/* Copia exacta",
    });

    expect(dark["--surface-inverted"]).toBeUndefined();
  });

  it.each([
    ["--text-on-inverted", "el texto del pie"],
    ["--text-on-inverted-support", "lo secundario"],
    ["--link-on-inverted", "los enlaces"],
  ])("%s aguanta AA sobre ella (%s)", (token) => {
    expect(contrastRatio(LIGHT[token], BACKGROUND)).toBeGreaterThanOrEqual(
      AA_THRESHOLD,
    );
  });

  /**
   * El canvas afirma que el verde sobre `#101410` da **8.4:1**. Da 6.16.
   *
   * Sobra para AA, así que el color entra tal cual; lo que no entra es el número. Queda escrito
   * aquí para que nadie lo repita de memoria, y para que si alguien retoca el verde buscando ese
   * 8.4 vea de qué estaba hablando la maqueta.
   */
  it("mide el verde de enlaces en 6.16, no en el 8.4 del canvas", () => {
    const medido = contrastRatio(LIGHT["--link-on-inverted"], BACKGROUND);

    expect(medido).toBeGreaterThan(6);
    expect(medido).toBeLessThan(7);
  });
});
