import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readCssVariables } from "./contrast";

/**
 * El tema oscuro está escrito dos veces en `colors.css` —una bajo `prefers-color-scheme` y otra
 * bajo `[data-theme="dark"]`— porque CSS no deja compartir un bloque de declaraciones entre una
 * media query y un selector normal, y hacen falta los dos: seguir al sistema y poder forzarlo.
 *
 * Esta prueba convierte esa duplicación de riesgo en invariante: las dos copias tienen que declarar
 * exactamente las mismas variables con exactamente los mismos valores.
 */
const CSS = readFileSync(join(__dirname, "colors.css"), "utf8");

const fromMediaQuery = readCssVariables(CSS, {
  // Con la llave: el comentario de cabecera del archivo también nombra la media query, y sin ella
  // el parseo arrancaba desde arriba y se tragaba el bloque claro entero.
  startAfter: "@media (prefers-color-scheme: dark) {",
  stopAt: "/* Copia exacta",
});

const fromAttribute = readCssVariables(CSS, {
  startAfter: ':root[data-theme="dark"] {',
  stopAt: "@theme",
});

describe("Las dos declaraciones del tema oscuro", () => {
  it("declaran el mismo conjunto de variables", () => {
    expect(Object.keys(fromAttribute).sort()).toEqual(
      Object.keys(fromMediaQuery).sort(),
    );
  });

  it("les dan exactamente los mismos valores", () => {
    expect(fromAttribute).toEqual(fromMediaQuery);
  });

  it("no está vacía — si el parseo falla, las dos coincidirían en la nada", () => {
    expect(Object.keys(fromAttribute).length).toBeGreaterThan(10);
  });
});
