import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readCssVariables } from "./contrast";

/**
 * Por qué la escala nueva estrena nombres en vez de subir los que había.
 *
 * Tailwind v4 publica su escala de radio como custom properties en `:root`, y su utilidad
 * `rounded-sm` no es más que `border-radius: var(--radius-sm)`. El bloque `:root` de `layout.css`
 * declara **esas mismas variables**: hoy no se nota porque los valores coinciden al milímetro con
 * los de Tailwind, que es justo lo que dice su comentario de cabecera.
 *
 * Ahí está la trampa. Subir `--radius-lg` de 8px a 18px para adoptar v2 no habría añadido una
 * escala: habría cambiado los 44 `rounded-lg` del sitio de golpe, más los 9 `rounded-sm` y los 8
 * `rounded-md`, sin que nadie tocara esos archivos. Por eso v2 entra con nombres propios
 * —`chip`, `control`, `card`, `panel`— expuestos en `@theme`: nada cambia hasta que un componente
 * lo pida, y los 71 `rounded-*` sueltos por fin tienen a dónde ir.
 */

const CSS = readFileSync(join(__dirname, "layout.css"), "utf8");

const ROOT = readCssVariables(CSS, { startAfter: ":root {", stopAt: "@theme" });
const THEME = readCssVariables(CSS, { startAfter: "@theme {" });

describe("La escala de radio de v2", () => {
  it.each([
    ["--radius-chip", "0.5rem", "chip, input chico", 8],
    ["--radius-control", "0.75rem", "botón, campo", 12],
    ["--radius-card", "1.125rem", "tarjeta", 18],
    ["--radius-panel", "1.625rem", "panel, diálogo", 26],
  ])("expone %s como %s (%s)", (token, value, _uso, px) => {
    expect(THEME[token]).toBe(value);
    expect(Number.parseFloat(value) * 16).toBe(px);
  });

  /**
   * La invariante que protege a los 71 `rounded-*` que ya existen. `--radius-sm|md|lg|xl|2xl|3xl`
   * son de Tailwind: declararlas aquí dentro de `@theme` las sobrescribiría.
   */
  it.each(["sm", "md", "lg", "xl", "2xl", "3xl", "4xl"])(
    "no toca rounded-%s, que es de Tailwind",
    (size) => {
      expect(THEME).not.toHaveProperty(`--radius-${size}`);
    },
  );

  it("mantiene el espejo de la escala de Tailwind fuera de @theme, como referencia escrita", () => {
    expect(ROOT).toMatchObject({
      "--radius-sm": "0.25rem",
      "--radius-md": "0.375rem",
      "--radius-lg": "0.5rem",
      "--radius-pill": "9999px",
    });
  });
});

describe("La elevación de v2", () => {
  /**
   * Un negro puro sobre un fondo cálido se ve sucio: tira a gris y ensucia el papel. Las cinco
   * sombras llevan el mismo verde que los neutrales.
   *
   * Las cinco, no tres. Estas variables pisan a las de Tailwind —a propósito, es lo que hace que
   * el cambio alcance a los 29 `shadow-*` que ya existen sin editarlos—, así que la que se quede
   * sin declarar conserva la de Tailwind, que es negra. Con solo `sm|md|lg`, un `shadow-xl` negro
   * convivía con un `shadow-lg` verde.
   */
  it.each([
    "--shadow-xs",
    "--shadow-sm",
    "--shadow-md",
    "--shadow-lg",
    "--shadow-xl",
  ])("%s deja de ser negra", (token) => {
    expect(ROOT[token]).toContain("rgba(31, 40, 24");
    expect(ROOT[token]).not.toMatch(/rgb\(0 0 0/);
  });

  it("mueve la duración base a 260ms y estrena una curva natural", () => {
    expect(ROOT["--duration-base"]).toBe("260ms");
    expect(ROOT["--ease-natural"]).toBe("cubic-bezier(0.22, 0.61, 0.36, 1)");
  });
});

/**
 * La prueba que faltaba, y que habría ahorrado este fallo.
 *
 * El slice 10 cargó Newsreader con `next/font`, declaró `--font-display` y expuso `font-display` a
 * Tailwind. Los slices 11, 12 y 13 pasaron sin que **ningún componente la pidiera**: la fuente se
 * descargaba en cada visita y no se pintaba en un solo píxel. Es el mismo anti-patrón que este
 * repo ya tenía documentado en la cabecera de `typography.css` —los tokens del slice 2 que nadie
 * consumía— y aun así volvió a pasar, porque nada lo vigilaba.
 *
 * Una fuente que se descarga y no se usa es peor que no tenerla: cuesta bytes y no da nada.
 */
describe("Las dos voces tipográficas", () => {
  const TSX = globSync("src/**/*.tsx", {
    ignore: ["**/*.test.tsx", "**/*.stories.tsx"],
  })
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  it("la serif tiene consumidores: si no, se descarga para nada", () => {
    expect(TSX).toMatch(/\bfont-display\b/);
  });

  it("la voz de interfaz la aplica el body, no cada componente", () => {
    const GLOBALS = readFileSync(
      join(__dirname, "../../../app/styles/globals.css"),
      "utf8",
    );
    expect(GLOBALS).toContain("font-family: var(--font-ui)");
  });
});

/**
 * La otra mitad del slice 10: la escala con nombre existía y 41 sitios seguían pidiendo el radio
 * por número.
 *
 * **La escala nueva no sobrescribe la de Tailwind, y eso es a propósito** —así nada cambió de forma
 * el día que se añadió—, pero significa que `rounded-lg` (8px) y `rounded-card` (18px) son cosas
 * distintas. Mientras las dos convivieran, «el radio de una tarjeta» seguía siendo una decisión que
 * cada archivo tomaba por su cuenta, que es justo lo que `Surface` documenta como descuido: «una
 * tarjeta con `rounded-card` junto a otra con `rounded-lg` no es una decisión, es un descuido».
 *
 * Los cuatro nombres cubren los cuatro papeles, así que en producción no hace falta ningún número.
 */
describe("El radio se pide por su papel, no por su número", () => {
  const NUMBERED = /(?<![\w-])rounded-(sm|md|lg|xl|2xl|3xl|4xl)(?![\w-])/;

  function classNamesIn(source: string): string[] {
    return [...source.matchAll(/className=\{?["'`]([^"'`]*)["'`]/g)].map(
      ([, classes]) => classes,
    );
  }

  it("ningún componente de producción usa la escala numerada", () => {
    const offenders = globSync("src/{app,presentation}/**/*.tsx", {
      ignore: ["**/*.test.tsx", "**/*.stories.tsx"],
    }).filter((file) =>
      classNamesIn(readFileSync(file, "utf8")).some((classes) =>
        NUMBERED.test(classes),
      ),
    );

    expect(
      offenders,
      `${offenders.join(", ")} pide el radio por número. Los papeles son ` +
        "rounded-chip (8), rounded-control (12), rounded-card (18) y rounded-panel (26).",
    ).toEqual([]);
  });

  /* `rounded-full` y `rounded-none` no son la escala: son formas, y siguen permitidas. */
  it.each([
    ["rounded-lg", true],
    ["rounded-2xl", true],
    ["rounded-full", false],
    ["rounded-none", false],
    ["rounded-chip", false],
    ["rounded-card", false],
    ["rounded-l-full", false],
  ])("reconoce %s como escala numerada: %s", (candidate, isNumbered) => {
    expect(NUMBERED.test(candidate)).toBe(isNumbered);
  });
});
