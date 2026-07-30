import PostEntity from "~/domain/entities/post/Post";

/**
 * El marcador que distingue un dato sembrado por la suite de uno real.
 *
 * Este módulo es puro a propósito —no toca la base— para que el predicado del barrido se pueda
 * probar sin conexión: lo que decide qué se borra de una base compartida merece pruebas que corran
 * en cualquier parte.
 *
 * **Prefijo y no sufijo.** Los datos que se filtraron una vez tenían la forma
 * `miel-de-abeja-1785417725068`: un timestamp al final. Barrer por ahí habría borrado también
 * cualquier publicación real que terminara en dígitos. Además `LIKE 'e2e-%'` usa el índice
 * `idx_translations_slug`, y `LIKE '%-123'` no.
 *
 * **En el slug y no en el título.** El título se ve en pantalla y varios escenarios lo comparan
 * literalmente; el slug es identificador, no contenido. Y como la app deriva el slug del título,
 * lo publicado desde `/publicar` también queda marcado si el título empieza por aquí.
 */
export const TEST_SLUG_PREFIX = "e2e-";

/** Las claves de categoría no admiten guion medio: el CHECK de la base exige guion bajo. */
export const TEST_CATEGORY_PREFIX = "e2e_";

/** Contador para que dos llamadas en el mismo milisegundo no produzcan el mismo slug. */
let counter = 0;

function unique(): string {
  counter += 1;

  return `${Date.now()}${counter}`;
}

export function testSlug(name: string): string {
  return `${TEST_SLUG_PREFIX}${name}-${unique()}`;
}

export function testCategoryKey(name: string): string {
  return `${TEST_CATEGORY_PREFIX}${name}_${unique()}`;
}

/**
 * Título y slug de una publicación que se crea **desde la UI**, donde el slug lo deriva la app.
 *
 * El slug se calcula con `PostEntity.generateSlug`, el mismo código que corre al publicar: si la
 * regla cambia, la prueba la sigue en vez de quedarse esperando una URL que ya no existe.
 *
 * El marcador va en el título porque es lo único que la prueba controla en ese camino; el prefijo
 * `E2E ` sobrevive a la generación como `e2e-`.
 */
export function testPost(name: string): { title: string; slug: string } {
  const title = `E2E ${name} ${unique()}`;

  return { title, slug: new PostEntity().generateSlug(title) };
}

export function isTestSlug(slug: string | null | undefined): boolean {
  return typeof slug === "string" && slug.startsWith(TEST_SLUG_PREFIX);
}

export function isTestCategoryKey(key: string | null | undefined): boolean {
  return typeof key === "string" && key.startsWith(TEST_CATEGORY_PREFIX);
}
