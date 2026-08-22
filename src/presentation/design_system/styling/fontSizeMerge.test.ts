import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cn } from "./merge-class-names";

/**
 * `tailwind-merge` desempata mirando **el nombre de la clase**, no el CSS generado: un
 * `text-display` que no esté en su lista le parece un color de texto, choca con `text-text-base` y
 * uno de los dos se cae. El elemento se queda sin tamaño y nada falla — ni `tsc`, ni el build, ni
 * una prueba que compruebe que la clase está en el `className` del componente.
 *
 * Pasó de verdad: `--fs-display` entró en el slice 10 y su nombre nunca llegó a la lista, así que
 * el titular de la portada salía a tamaño de cuerpo en una serif. Esta prueba es lo que faltaba
 * para que el próximo tamaño nuevo no repita el viaje.
 */
const TYPOGRAPHY = readFileSync(
  "src/presentation/design_system/tokens/typography.css",
  "utf8",
);

/** Los `--text-*` que `@theme` expone como utilidades de tamaño. */
function exposedFontSizes(): string[] {
  const theme = TYPOGRAPHY.slice(TYPOGRAPHY.indexOf("@theme"));

  return [...theme.matchAll(/^\s*--text-([a-z-]+):/gm)].map(
    (match) => match[1],
  );
}

describe("los tamaños de fuente sobreviven al desempate de tailwind-merge", () => {
  it("expone alguno, o esta prueba no estaría comprobando nada", () => {
    expect(exposedFontSizes().length).toBeGreaterThan(0);
  });

  it.each(exposedFontSizes())(
    "text-%s no se descarta al ir junto a un color de texto",
    (size) => {
      const result = cn(`text-${size}`, "text-text-base");

      expect(
        result,
        `text-${size} existe en typography.css pero tailwind-merge lo descarta: ` +
          "falta en FONT_SIZES de merge-class-names.ts",
      ).toContain(`text-${size}`);
      // Y el color sigue ahí: son dos propiedades distintas, no un conflicto.
      expect(result).toContain("text-text-base");
    },
  );

  /* La otra mitad: dos tamaños sí son un conflicto, y ahí gana el último. */
  it("dos tamaños siguen desempatando entre sí", () => {
    expect(cn("text-body", "text-display")).toBe("text-display");
  });
});
