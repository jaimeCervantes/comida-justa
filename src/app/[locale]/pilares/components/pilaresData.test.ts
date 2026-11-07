import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { stripComments } from "~/scripts/stripComments";
import { PILLARS, pillarColorClasses } from "./pilaresData";

/**
 * Cubre el escenario "Los pilares estrenan su paleta" (`@slice-4`) de
 * `src/e2e/design-system/design-system.feature`.
 */
describe("La paleta de los cuatro pilares", () => {
  it("da a cada pilar su propio juego de clases", () => {
    for (const pillar of PILLARS) {
      expect(pillarColorClasses[pillar.key]).toBeDefined();
    }
    expect(Object.keys(pillarColorClasses)).toHaveLength(PILLARS.length);
  });

  it.each(PILLARS)(
    "el pilar $key se pinta solo con tokens --pillar-*",
    ({ key }) => {
      const classes = Object.values(pillarColorClasses[key]).join(" ");
      const colorClasses = classes
        .split(/\s+/)
        .filter((c) => /^(text|bg|border|hover:border|hover:bg)-/.test(c));

      expect(colorClasses.length).toBeGreaterThan(0);
      for (const cssClass of colorClasses) {
        expect(cssClass).toMatch(
          /-pillar-(sleep|nutrition|movement|mind-spirit)-/,
        );
      }
    },
  );

  /**
   * El modo oscuro lo resuelve la variable CSS, no una segunda clase. Antes cada color venía en
   * pareja (`text-violet-600 dark:text-violet-400`) y había que acordarse de las dos; olvidarse de
   * una es exactamente el tipo de fallo que nadie ve hasta que alguien usa el tema oscuro.
   */
  it("no necesita variantes dark: — el token cambia solo", () => {
    const classes = Object.values(pillarColorClasses)
      .flatMap((c) => Object.values(c))
      .join(" ");

    expect(classes).not.toContain("dark:");
  });
});

describe("Las páginas de pilares", () => {
  const COMPONENTS_DIR = __dirname;

  /** Los tonos genéricos de Tailwind que la marca vino a reemplazar. */
  const FOREIGN_PALETTES =
    /\b(?:dark:)?(?:text|bg|border|from|to|via|shadow)-(?:violet|sky|emerald|purple|indigo)-\d{2,3}\b/;

  const pageFiles = readdirSync(COMPONENTS_DIR).filter(
    (file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"),
  );

  it("hay páginas que revisar — si el glob se rompe, la prueba pasaría vacía", () => {
    expect(pageFiles.length).toBeGreaterThanOrEqual(6);
  });

  it.each(pageFiles)("%s no usa colores ajenos a la marca", (file) => {
    // Sin quitar comentarios el escáner se tropieza con su propia documentación: estos archivos
    // citan a propósito las clases rotas que vinieron a reemplazar.
    const source = stripComments(
      readFileSync(join(COMPONENTS_DIR, file), "utf8"),
    );
    const match = source.match(FOREIGN_PALETTES);

    expect(
      match?.[0],
      `${file} usa "${match?.[0]}" en lugar del token del pilar`,
    ).toBeUndefined();
  });

  /**
   * La cicatriz de un find/replace anterior: había quedado ` da dark:` como clase suelta,
   * `bg-violet-50/da` y `text-violet-100xt-lg` repartidos por las páginas. Sobrevivió porque cada
   * página escribía su color a mano; con el color centralizado ya no puede volver, pero la prueba
   * se queda porque el destrozo fue silencioso.
   */
  it.each(pageFiles)("%s no arrastra clases rotas", (file) => {
    // Sin quitar comentarios el escáner se tropieza con su propia documentación: estos archivos
    // citan a propósito las clases rotas que vinieron a reemplazar.
    const source = stripComments(
      readFileSync(join(COMPONENTS_DIR, file), "utf8"),
    );

    expect(source).not.toMatch(/\bda dark:/);
    expect(source).not.toMatch(/\/da\b/);
    expect(source).not.toMatch(/-\d{2,3}xt-/);
  });
});
