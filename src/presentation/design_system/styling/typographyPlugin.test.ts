import { globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * `prose` y sus modificadores los emite `@tailwindcss/typography`, que **no está instalado**.
 *
 * Las dos páginas legales llevaban seis de esas clases cada una —`prose prose-sm sm:prose-base
 * md:prose-lg prose-zinc dark:prose-invert`— y ninguna existía: el CSS publicado no tiene una sola
 * regla `.prose`. Su cuerpo se pintaba solo con `text-text-support` y los estilos de cada párrafo,
 * y nada avisó nunca, porque en Tailwind v4 una clase que no existe no falla: desaparece.
 *
 * Esta prueba ata las dos mitades. Si alguien vuelve a escribir `prose`, falla; y si alguien
 * instala el plugin de verdad, también falla — para que se venga aquí a retirarla en vez de
 * dejarla mintiendo.
 */
const PACKAGE = JSON.parse(readFileSync("package.json", "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const PLUGIN = "@tailwindcss/typography";

/**
 * `prose` sola o con modificador (`prose-lg`, `prose-zinc`, `prose-invert`).
 *
 * El `(?<![-\w])` es lo que salva a `max-w-prose`, que **sí** existe: es de Tailwind, mide 65ch y
 * no tiene nada que ver con el plugin. Sin él, esta prueba acusaba a `/auth/signin`, que la usa
 * bien.
 */
const PROSE = /(?<![-\w])prose(-[a-z0-9]+)?\b/;

function sourceFiles(): string[] {
  return globSync("src/**/*.tsx").filter((file) => !file.includes(".test."));
}

describe("las clases del plugin de tipografía", () => {
  const installed = Boolean(
    PACKAGE.dependencies?.[PLUGIN] ?? PACKAGE.devDependencies?.[PLUGIN],
  );

  it("el plugin sigue sin instalarse; si se instala, retira esta prueba", () => {
    expect(installed).toBe(false);
  });

  it("no se usa ninguna, porque ninguna existiría", () => {
    const offenders = sourceFiles().filter((file) => {
      const source = readFileSync(file, "utf8");
      /* Solo lo escrito dentro de un `className`: los comentarios que explican por qué se fueron
         mencionan las clases a propósito. */
      return [...source.matchAll(/className=\{?["'`]([^"'`]*)["'`]/g)].some(
        ([, classes]) => PROSE.test(classes),
      );
    });

    expect(
      offenders,
      `${offenders.join(", ")} usa clases \`prose\` y ${PLUGIN} no está instalado: ` +
        "no emiten ninguna regla",
    ).toEqual([]);
  });

  /* La otra mitad del patrón: `max-w-prose` es de Tailwind y tiene que seguir permitida. */
  it.each<[string, boolean]>([
    ["prose", true],
    ["prose-lg", true],
    ["prose-zinc", true],
    ["dark:prose-invert", true],
    ["max-w-prose", false],
    ["proselytize", false],
  ])("reconoce %s como clase del plugin: %s", (candidate, isPlugin) => {
    expect(PROSE.test(candidate)).toBe(isPlugin);
  });
});
