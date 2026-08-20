import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AA_THRESHOLD, contrastRatio, readCssVariables } from "./contrast";

/**
 * El agujero que este archivo tapa.
 *
 * `pillarPalette.contrast.test.ts` midió la rampa de los **pilares** desde el slice 3 y la dejó
 * blindada. La rampa de la **marca** nunca se midió, y llevaba dos años mal: `--brand-green`
 * (`#538f39`, el corazón del logo) rellenaba 28 botones con texto blanco encima a 3.92, y aparecía
 * como tinta en otros 57 sitios a 3.67. Los dos por debajo del mínimo AA de 4.5.
 *
 * La lección del slice 3 aplicada a la marca: **un color de marca no es una tinta**. Identificar y
 * rellenar son dos trabajos, y el mismo hex rara vez sirve para los dos.
 *
 * Se mide sobre pares **semánticos** (`--button-primary-text` sobre `--button-primary-bg`) y no
 * sobre hexes sueltos, porque es el par el que tiene que cumplir: quien cambie el relleno sin tocar
 * su texto rompe la pareja, y eso es justo lo que hay que atrapar. Y se lee **`colors.css`**, no
 * una copia en TypeScript, por la misma razón que el slice 3: un espejo se desincroniza.
 */

const CSS = readFileSync(join(__dirname, "colors.css"), "utf8");

const LIGHT = readCssVariables(CSS, {
  startAfter: ":root {",
  stopAt: "@media (prefers-color-scheme: dark)",
});
const DARK = readCssVariables(CSS, {
  startAfter: "@media (prefers-color-scheme: dark) {",
  stopAt: "/* Copia exacta",
});

/** Umbral de «Non-text Contrast» (WCAG 1.4.11): el límite de un control, no su texto. */
const UI_THRESHOLD = 3;

/**
 * Resuelve `var(--otro)` hasta llegar a un hex.
 *
 * `colors.css` encadena a propósito —`--button-primary-bg: var(--brand-green)` y `--brand-green:
 * var(--brand-green-700)`— para que el tema oscuro mueva **una** variable y arrastre a las demás.
 * `readCssVariables` devuelve el texto tal cual, así que sin esto mediríamos la cadena
 * `"var(--brand-green)"` en vez de un color.
 */
function resolve(scope: Record<string, string>, name: string): string {
  const seen = new Set<string>();
  let value = scope[name];

  while (value?.startsWith("var(")) {
    const referenced = value.slice(4, value.indexOf(")")).trim();
    if (seen.has(referenced)) {
      throw new Error(`Circular custom-property reference at "${name}"`);
    }
    seen.add(referenced);
    value = scope[referenced];
  }

  if (!value) {
    throw new Error(`Token not declared in this theme: "${name}"`);
  }
  return value;
}

/** En oscuro solo se redefine lo que cambia; el resto se hereda del bloque claro, como los pilares. */
const inDark = (name: string): string =>
  resolve({ ...LIGHT, ...DARK }, name) ?? resolve(LIGHT, name);

type Pair = readonly [ink: string, ground: string, label: string];

/** Todo relleno que lleva texto encima, con el texto que le toca. */
const TEXT_PAIRS: readonly Pair[] = [
  ["--button-primary-text", "--button-primary-bg", "botón primario"],
  ["--button-primary-text", "--button-primary-hover", "botón primario, hover"],
  ["--button-secondary-text", "--button-secondary-bg", "botón secundario"],
  [
    "--button-secondary-text",
    "--button-secondary-hover",
    "botón secundario, hover",
  ],
  ["--button-buy-text", "--button-buy-bg", "botón de compra"],
  ["--button-buy-text", "--button-buy-hover", "botón de compra, hover"],
  ["--feedback-success-ink", "--feedback-success-soft", "aviso de éxito"],
  ["--feedback-warning-ink", "--feedback-warning-soft", "aviso de advertencia"],
  ["--feedback-error-ink", "--feedback-error-soft", "aviso de error"],
  ["--brand-green-900", "--brand-green-soft", "tinta sobre el chip verde"],
];

/** Cada tinta contra cada superficie donde puede caer. Una tinta legible «casi siempre» no sirve. */
const INKS = [
  "--text-base",
  "--text-support",
  "--text-muted",
  "--brand-green",
  "--highlight",
] as const;

const SURFACES = [
  "--surface-background",
  "--surface-elevation-1",
  "--surface-elevation-2",
] as const;

describe("La rampa de la marca", () => {
  it("conserva la semilla del logo con nombre propio", () => {
    expect(LIGHT["--brand-green-600"]).toBe("#538f39");
  });

  /**
   * La razón de ser del slice: la semilla identifica y no rellena. Si alguien vuelve a apuntar
   * `--brand-green` al verde del logo, esta prueba lo dice antes de que 85 usos vuelvan a fallar.
   */
  it("no rellena con la semilla, porque la semilla no aguanta texto blanco", () => {
    const white = resolve(LIGHT, "--brand-white");
    expect(contrastRatio(white, LIGHT["--brand-green-600"])).toBeLessThan(
      AA_THRESHOLD,
    );
    expect(resolve(LIGHT, "--brand-green")).not.toBe(
      LIGHT["--brand-green-600"],
    );
    expect(
      contrastRatio(white, resolve(LIGHT, "--brand-green")),
    ).toBeGreaterThanOrEqual(AA_THRESHOLD);
  });

  it("baja de luminosidad sin cambiar de matiz", () => {
    const hue = (hex: string): number => {
      const [r, g, b] = [1, 3, 5].map(
        (i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255,
      );
      const max = Math.max(r, g, b);
      const delta = max - Math.min(r, g, b);
      if (delta === 0) return 0;
      const raw =
        max === r
          ? (g - b) / delta + (g < b ? 6 : 0)
          : max === g
            ? (b - r) / delta + 2
            : (r - g) / delta + 4;
      return raw * 60;
    };

    /* Tres grados de tolerancia: el relleno se derivó a ojo sobre la semilla, no por fórmula. */
    for (const step of ["700", "800", "900"] as const) {
      expect(
        Math.abs(
          hue(LIGHT[`--brand-green-${step}`]) - hue(LIGHT["--brand-green-600"]),
        ),
      ).toBeLessThan(3);
    }
  });
});

describe.each(TEXT_PAIRS)("%s sobre %s — %s", (ink, ground, _label) => {
  it("es legible en claro", () => {
    expect(
      contrastRatio(resolve(LIGHT, ink), resolve(LIGHT, ground)),
    ).toBeGreaterThanOrEqual(AA_THRESHOLD);
  });

  it("es legible en oscuro", () => {
    expect(contrastRatio(inDark(ink), inDark(ground))).toBeGreaterThanOrEqual(
      AA_THRESHOLD,
    );
  });
});

describe.each(INKS)("%s", (ink) => {
  it.each(SURFACES)("es legible sobre %s en claro", (surface) => {
    expect(
      contrastRatio(resolve(LIGHT, ink), resolve(LIGHT, surface)),
    ).toBeGreaterThanOrEqual(AA_THRESHOLD);
  });

  it.each(SURFACES)("es legible sobre %s en oscuro", (surface) => {
    expect(contrastRatio(inDark(ink), inDark(surface))).toBeGreaterThanOrEqual(
      AA_THRESHOLD,
    );
  });
});

/**
 * El borde de un campo **sí** cae bajo «Non-text Contrast»: es lo único que dice dónde empieza el
 * control. Un separador decorativo (`--border`, `--separator`) no, y por eso no está aquí.
 *
 * El documento de diseño v2 proponía `#c9c0ac`, que da 1.81 sobre blanco. Entró corregido.
 */
describe("El borde de un campo", () => {
  it.each(SURFACES)("se distingue de %s en claro", (surface) => {
    expect(
      contrastRatio(resolve(LIGHT, "--border-field"), resolve(LIGHT, surface)),
    ).toBeGreaterThanOrEqual(UI_THRESHOLD);
  });

  it.each(SURFACES)("se distingue de %s en oscuro", (surface) => {
    expect(
      contrastRatio(inDark("--border-field"), inDark(surface)),
    ).toBeGreaterThanOrEqual(UI_THRESHOLD);
  });
});
