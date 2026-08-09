import { describe, expect, it } from "vitest";
import { assignToColumns } from "./MasonryColumns";

/**
 * El reparto es lo único que se prueba aquí, y a propósito: es la regla, y es pura. Lo demás
 * —medir, observar el ancho— es el navegador, y jsdom no maqueta nada, así que afirmarlo ahí sería
 * afirmar sobre ceros.
 */
describe("assignToColumns", () => {
  it("manda cada tarjeta a la columna más corta hasta ese momento", () => {
    // 400 → col0; 200 → col1; 200 → col2; la cuarta va a la más corta de las tres.
    expect(assignToColumns([400, 200, 200, 100], 3)).toEqual([0, 1, 2, 1]);
  });

  it("con una sola columna, todas van a la misma", () => {
    expect(assignToColumns([400, 200, 300], 1)).toEqual([0, 0, 0]);
  });

  /**
   * La propiedad que arregla el fallo reportado: colocar la número 10 no puede cambiar dónde
   * quedaron las nueve anteriores, porque su decisión ya estaba tomada cuando solo existían ellas.
   *
   * Es lo que la multi-columna de CSS no puede dar: `column-fill: balance` reparte de nuevo TODAS
   * las tarjetas al añadir una, y por eso lo ya visto se movía al cargar más.
   */
  it("es estable al añadir: lo ya colocado no se mueve", () => {
    const primeras = [400, 200, 200, 100, 350, 150, 500, 120, 260];
    const siguientes = [300, 180, 420, 200, 260, 340, 190, 280, 210];

    const antes = assignToColumns(primeras, 3);
    const despues = assignToColumns([...primeras, ...siguientes], 3);

    expect(despues.slice(0, primeras.length)).toEqual(antes);
  });

  it("y lo sigue siendo tanda tras tanda", () => {
    const alturas = Array.from(
      { length: 45 },
      (_, i) => 150 + ((i * 37) % 300),
    );

    for (let corte = 9; corte < alturas.length; corte += 9) {
      const antes = assignToColumns(alturas.slice(0, corte), 3);
      const despues = assignToColumns(alturas.slice(0, corte + 9), 3);

      expect(despues.slice(0, corte)).toEqual(antes);
    }
  });

  /* No promete un reparto óptimo —el voraz no lo da—, pero sí que ninguna columna se quede muy
     descolgada, que es lo que se veía como hueco. */
  it("deja las columnas parejas: ninguna se descuelga de la más alta", () => {
    const alturas = Array.from(
      { length: 30 },
      (_, i) => 150 + ((i * 53) % 280),
    );
    const asignacion = assignToColumns(alturas, 3);

    const totales = [0, 0, 0];
    alturas.forEach((alto, i) => {
      totales[asignacion[i]] += alto + 16;
    });

    const masAlta = Math.max(...totales);
    const masCorta = Math.min(...totales);

    // La diferencia no puede pasar de lo que mide la tarjeta más alta: es la cota del voraz.
    expect(masAlta - masCorta).toBeLessThanOrEqual(Math.max(...alturas) + 16);
  });

  it("no deja columnas vacías cuando hay tarjetas de sobra", () => {
    const asignacion = assignToColumns([200, 200, 200, 200, 200, 200], 3);

    expect(new Set(asignacion)).toEqual(new Set([0, 1, 2]));
  });
});
