/** Lo que en una expresión regular significa otra cosa, escapado para leerse tal cual. */
function literal(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * El nombre accesible de un campo: su etiqueta, seguida quizá del `*` de obligatorio. Se busca por
 * el principio para que el asterisco no obligue a escribirlo en cada prueba.
 */
export function labelled(text: string): RegExp {
  return new RegExp(`^${literal(text)}`);
}
