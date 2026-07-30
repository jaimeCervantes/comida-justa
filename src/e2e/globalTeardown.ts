import {
  countTestData,
  describeTestData,
  sweepTestData,
} from "./testUtils/testData";

/**
 * Barre y **falla si algo quedó**.
 *
 * Fallar es el objetivo, no un efecto colateral: la vez que la suite dejó datos, nadie se enteró
 * hasta que rompió las pruebas de otro repositorio, y se diagnosticó mal. Un residuo tiene que
 * verse aquí, con su nombre, y no tres repos más allá.
 */
export default async function globalTeardown(): Promise<void> {
  const removed = await sweepTestData();
  const left = await countTestData();

  if (left.posts > 0 || left.categories > 0) {
    throw new Error(
      `[e2e] quedaron ${describeTestData(left)} en la base compartida y el barrido no pudo ` +
        "borrarlas. Revísalas a mano: `SELECT slug FROM post_translations WHERE slug LIKE 'e2e-%'`.",
    );
  }

  if (removed.posts > 0 || removed.categories > 0) {
    // Que un `afterEach` no haya corrido no rompe la suite, pero conviene saberlo.
    console.warn(
      `[e2e] el barrido final tuvo que borrar ${describeTestData(removed)}: ` +
        "algún escenario no limpió lo suyo.",
    );
  }
}
