import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AA_THRESHOLD, contrastRatio, readCssVariables } from "./contrast";

/**
 * Cubre los escenarios de `src/e2e/pilares/colores-pilares-vivos.feature` y las invariantes de
 * contraste de `src/e2e/design-system/design-system.feature`.
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

const EXPECTED_LIGHT_RAMPS: Record<
  Pillar,
  { solid: string; soft: string; ink: string }
> = {
  sleep: { solid: "#7c3aed", soft: "#f5f3ff", ink: "#7c3aed" },
  nutrition: { solid: "#dd340d", soft: "#fde3dd", ink: "#c52e0b" },
  movement: { solid: "#408410", soft: "#e8f6df", ink: "#3c7b0f" },
  "mind-spirit": { solid: "#0369a1", soft: "#f0f9ff", ink: "#0369a1" },
};

const EXPECTED_DARK_RAMPS: Record<Pillar, { soft: string; ink: string }> = {
  sleep: { soft: "#2e1065", ink: "#c4b5fd" },
  nutrition: { soft: "#36150d", ink: "#f4522e" },
  movement: { soft: "#1b2d0f", ink: "#5dbf17" },
  "mind-spirit": { soft: "#0c2a3b", ink: "#38bdf8" },
};

/** En oscuro solo se redefinen `soft` e `ink`; `solid` se hereda del bloque claro a propósito. */
const inDark = (name: string): string => DARK[name] ?? LIGHT[name];

describe("La rampa de los cuatro pilares", () => {
  it.each(PILLARS)("define los tres papeles de %s en modo claro", (pillar) => {
    expect({
      solid: LIGHT[`--pillar-${pillar}-solid`],
      soft: LIGHT[`--pillar-${pillar}-soft`],
      ink: LIGHT[`--pillar-${pillar}-ink`],
    }).toEqual(EXPECTED_LIGHT_RAMPS[pillar]);
  });

  it.each(PILLARS)("redefine soft e ink de %s en modo oscuro", (pillar) => {
    expect({
      soft: DARK[`--pillar-${pillar}-soft`],
      ink: DARK[`--pillar-${pillar}-ink`],
    }).toEqual(EXPECTED_DARK_RAMPS[pillar]);
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
   * Movimiento y Mente tienen casi la misma luminosidad: quien no distingue el tono no los
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
