/**
 * Un bloque de etiquetas **al final** del texto: `#BuenSueño #DormirBien #SaludJusta`.
 *
 * Solo al final a propósito. Un `#` en medio de una frase casi nunca es una etiqueta —"Calle
 * Melchor Ocampo #2", "el #1 en ventas"— y borrarlo destrozaría el texto. Lo que sí es siempre
 * relleno es la ristra con la que se cierra una publicación de redes.
 */
const TRAILING_HASHTAGS = /(?:\s*#[^\s#]+)+\s*$/u;

export interface SplitContent {
  /** El texto sin la ristra final de etiquetas. */
  body: string;
  /** Las etiquetas encontradas, sin el `#`. */
  hashtags: string[];
}

/**
 * Separa el texto de sus etiquetas.
 *
 * Las publicaciones nacieron como reels, así que arrastran su bloque de hashtags. En la página no
 * molestan —quien las escribió las quiso ahí—, pero **no pueden entrar en los textos derivados**:
 * ni en la descripción que lee un buscador, ni en el resumen del feed, ni en el índice para
 * asistentes. Ahí son relleno que desplaza a las palabras que sí dicen algo.
 */
export function splitHashtags(
  content: string | null | undefined,
): SplitContent {
  const text = content ?? "";
  const match = text.match(TRAILING_HASHTAGS);

  if (!match) return { body: text, hashtags: [] };

  return {
    body: text.slice(0, match.index).trimEnd(),
    hashtags: (match[0].match(/#[^\s#]+/gu) ?? []).map((tag) => tag.slice(1)),
  };
}

/** Solo el texto, que es lo que piden casi todos los llamadores. */
export function withoutHashtags(content: string | null | undefined): string {
  return splitHashtags(content).body;
}
