import { describe, expect, it } from "vitest";
import {
  PUBLICATION_PILLARS,
  publicationPillarForCategory,
  publicationPillarNumber,
} from "./publicationPillars";

/**
 * La vuelta que necesitaba la tarjeta: el 5.2 pone la insignia del pilar encima de la foto, y hasta
 * ahora una publicación solo sabía su categoría.
 *
 * Las claves son las reales de la tabla `categories`, consultadas el 2026-08-21.
 */
describe("el pilar de una publicación", () => {
  it.each([
    ["sueno_y_descanso", "sleep", 1],
    ["alimentacion", "nutrition", 2],
    ["movimiento_y_ejercicio", "movement", 3],
    ["mente_y_espiritu", "mindSpirit", 4],
  ] as const)(
    "%s pertenece a %s, que es el número %i",
    (key, pilar, numero) => {
      const found = publicationPillarForCategory(key);

      expect(found).toBe(pilar);
      expect(found && publicationPillarNumber(found)).toBe(numero);
    },
  );

  /*
   * `null` no es un fallo: los diez anuncios de la base van sin categoría, y una categoría que no
   * cuelga de ninguno de los cuatro tampoco tiene pilar. La tarjeta se calla en vez de inventarlo.
   */
  /* El genérico va explícito porque los casos mezclan `null`, `undefined` y `string`: sin él,
     TypeScript infiere una **unión** de tuplas (`[null, string] | [string, string] | …`) y ninguna
     firma de callback es asignable a todas a la vez. Con una sola tupla, el caso vuelve a tipar. */
  it.each<[string | null | undefined, string]>([
    [null, "un anuncio, que va sin categoría"],
    [undefined, "una tarjeta armada a mano"],
    ["", "cadena vacía"],
    ["jugos", "una sub-categoría, no una raíz"],
    ["Food", "la taxonomía propia del chatbot"],
  ])("no inventa pilar para %s (%s)", (categoria) => {
    expect(publicationPillarForCategory(categoria)).toBeNull();
  });

  /* Y la lista sigue siendo la fuente: si alguien añade un pilar, esta vuelta lo conoce sola. */
  it("cubre los cuatro pilares que declara la lista", () => {
    for (const { key, categoryKey, number } of PUBLICATION_PILLARS) {
      expect(publicationPillarForCategory(categoryKey)).toBe(key);
      expect(publicationPillarNumber(key)).toBe(number);
    }
  });
});
