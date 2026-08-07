import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AA_THRESHOLD, contrastRatio, readCssVariables } from "./contrast";

/**
 * Cubre los `Scenario Outline` "Cada pilar tiene una rampa de tres papeles" y "Ninguna combinación
 * de la paleta baja de AA" de `src/e2e/design-system/design-system.feature`.
 *
 * Lee **`colors.css`**, no una copia en TypeScript: el objetivo es que retocar un hex y romper el
 * contraste falle aquí, no en la cara de un usuario. Un espejo en TS se desincroniza en cuanto
 * alguien edita el token y se olvida del espejo.
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

/** En kebab-case porque así se llaman los tokens: Tailwind no es fiable con mayúsculas en clases. */
const PILLARS = ["sleep", "nutrition", "movement", "mind-spirit"] as const;
type Pillar = (typeof PILLARS)[number];

/** En oscuro solo se redefinen `soft` e `ink`; `solid` se hereda del bloque claro a propósito. */
const inDark = (name: string): string => DARK[name] ?? LIGHT[name];

describe("La rampa de los cuatro pilares", () => {
  it.each(PILLARS)("define los tres papeles de %s en modo claro", (pillar) => {
    expect(LIGHT[`--pillar-${pillar}-solid`]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(LIGHT[`--pillar-${pillar}-soft`]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(LIGHT[`--pillar-${pillar}-ink`]).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it.each(PILLARS)("redefine soft e ink de %s en modo oscuro", (pillar) => {
    expect(DARK[`--pillar-${pillar}-soft`]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(DARK[`--pillar-${pillar}-ink`]).toMatch(/^#[0-9a-f]{6}$/i);
  });

  describe.each(PILLARS)("%s", (pillar: Pillar) => {
    it("su tinta es legible sobre su propio chip en claro", () => {
      const ratio = contrastRatio(
        LIGHT[`--pillar-${pillar}-ink`],
        LIGHT[`--pillar-${pillar}-soft`],
      );
      expect(ratio).toBeGreaterThanOrEqual(AA_THRESHOLD);
    });

    it("su tinta es legible sobre su propio chip en oscuro", () => {
      const ratio = contrastRatio(
        inDark(`--pillar-${pillar}-ink`),
        inDark(`--pillar-${pillar}-soft`),
      );
      expect(ratio).toBeGreaterThanOrEqual(AA_THRESHOLD);
    });

    it("aguanta texto blanco sobre su relleno sólido", () => {
      const ratio = contrastRatio("#ffffff", LIGHT[`--pillar-${pillar}-solid`]);
      expect(ratio).toBeGreaterThanOrEqual(AA_THRESHOLD);
    });

    it("su tinta destaca sobre el fondo de la página en ambos temas", () => {
      expect(
        contrastRatio(
          LIGHT[`--pillar-${pillar}-ink`],
          LIGHT["--surface-background"],
        ),
      ).toBeGreaterThanOrEqual(AA_THRESHOLD);
      expect(
        contrastRatio(
          inDark(`--pillar-${pillar}-ink`),
          DARK["--surface-background"],
        ),
      ).toBeGreaterThanOrEqual(AA_THRESHOLD);
    });
  });

  /**
   * La razón por la que el número del pilar no es decorativo.
   *
   * Movimiento y Mente quedaron casi con la misma luminosidad: quien no distingue el tono no los
   * separa. Esta prueba no exige que se arregle —la marca manda sobre la comodidad del test— sino
   * que documenta el límite, para que nadie construya una UI donde el color sea el único dato.
   */
  it("deja constancia de que dos pilares no se distinguen solo por luminosidad", () => {
    const ratio = contrastRatio(
      LIGHT["--pillar-movement-ink"],
      LIGHT["--pillar-mind-spirit-ink"],
    );
    expect(ratio).toBeLessThan(1.5);
  });
});
