import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import en from "~/i18n/messages/en.json";
import es from "~/i18n/messages/es.json";

/**
 * «Fuera los emoji como sistema» — primera anotación del 5.11.
 *
 * No es una manía tipográfica. En `/nosotros` los emoji **hacían de sistema**: la ✅ era el único
 * indicador de lista de toda la página, y en el bloque del cacahuate había tres distintos —✅, 💪,
 * 🌿— para tres cosas del mismo rango, lo que hace leerlas como categorías diferentes. Y cada
 * plataforma los dibuja a su manera, así que ni siquiera son el mismo símbolo para todos.
 *
 * Lo que sustituye a cada uno **no es nada**: las insignias de pilar ya traen su número y las
 * viñetas su marca. Un rótulo no necesita un dibujo delante para ser un rótulo.
 *
 * Esta prueba mira los **textos**, que es por donde volverían: en el componente se verían al
 * revisar, pero en un JSON de mensajes pasan desapercibidos — de hecho llevaban 25 claves.
 */
const EMOJI =
  /[\u{1F000}-\u{1FAFF}\u{2190}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

describe("Los textos de /nosotros", () => {
  it.each([
    ["es", es.about],
    ["en", en.about],
  ])("no llevan emoji (%s)", (_locale, about) => {
    const conEmoji = Object.entries(about)
      .filter(([, value]) => typeof value === "string" && EMOJI.test(value))
      .map(([key]) => key);

    expect(conEmoji).toEqual([]);
  });

  /**
   * El componente tampoco: los tres que quedan en el archivo están **dentro de comentarios**,
   * documentando lo que se quitó. Se mira solo el JSX para no prohibir contar la historia.
   */
  it("y su página tampoco los pinta", () => {
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");
    const sinComentarios = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

    expect(EMOJI.test(sinComentarios)).toBe(false);
  });
});
