/**
 * Los controles bidireccionales de Unicode.
 *
 * `U+202E` (RIGHT-TO-LEFT OVERRIDE) y sus hermanos dan la vuelta al texto **mostrado** sin cambiar
 * el guardado: lo que se lee en la ficha puede decir lo contrario de lo que hay en la base. Es el
 * mismo truco que se conoce como «Trojan Source» en el código fuente, y en un comentario sirve para
 * que alguien lea una recomendación donde está escrita una advertencia.
 *
 * No hay texto legítimo en este sitio que los necesite: la comunidad escribe en español y en inglés,
 * dos escrituras de izquierda a derecha.
 *
 * Escritos con `\u` y no con el carácter suelto **a propósito**: pegados literalmente son invisibles
 * en el editor —el fichero deja de poder leerse con `grep`, que empieza a llamarlo binario— y nadie
 * puede revisar ni corregir una clase de caracteres que no ve.
 */
const BIDI_CONTROLS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

/**
 * Los invisibles que parten una palabra sin que se note.
 *
 * `h\u200Bo\u200Bl\u200Ba` se lee «hola» y no casa con ninguna búsqueda de «hola». Importa ahora,
 * antes de la moderación: un filtro que no ve la palabra no puede juzgarla, y el hueco se abre justo
 * cuando llega quien tiene motivos para esquivarlo.
 *
 * **`U+200D` y `U+200C` se quedan fuera de esta lista a propósito.** Son de la misma categoría
 * Unicode (`Cf`) y también sirven para esquivar, pero el primero es lo que une 👨‍👩‍👧 en un solo
 * emoji y los dos son ortografía de verdad en persa y en devanagari. Quitarlos convertiría una
 * familia en tres personas sueltas: un daño visible y seguro, a cambio de cerrar un rodeo que la
 * moderación puede ver de todas formas.
 */
const INVISIBLE_SEPARATORS = /[\u00AD\u200B\u2060\uFEFF]/g;

/**
 * Los controles de C0 y C1, menos el salto de línea y el tabulador.
 *
 * Un `\u0000` o un `\u0007` en una columna `text` no le dice nada a nadie y sí puede confundir a lo
 * que lea esa fila después. El salto de línea sobrevive porque la ficha lo respeta —la sección se
 * pinta con `whitespace-pre-wrap`— y es la única forma que tiene alguien de separar dos ideas.
 */
// biome-ignore lint/suspicious/noControlCharactersInRegex: son exactamente lo que se quiere quitar.
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;

/** Tres o más saltos seguidos se quedan en dos: un párrafo en blanco, no una pantalla en blanco. */
const NEWLINE_AVALANCHE = /\n{3,}/g;

/**
 * Deja un comentario en la forma en que se va a guardar, leer y juzgar.
 *
 * **Está en el dominio y no en la acción** porque es una regla sobre qué es un comentario, no sobre
 * cómo llega: la misma tiene que valer el día que uno entre por otra puerta —una API, el bot— y hoy
 * no hay nada que garantice que esa puerta se acuerde de normalizar.
 *
 * El orden importa. Se normaliza a NFC **primero**, para que lo que se quita después se busque sobre
 * un texto ya en su forma canónica; y el recorte va al final, porque quitar invisibles deja espacios
 * en los bordes que antes no lo parecían. Quien cuente caracteres para el tope tiene que contarlos
 * sobre esto y no sobre lo que llegó: si no, se rechaza por largo un comentario que se habría
 * guardado corto.
 *
 * Lo que **no** hace: juzgar. Aquí no se decide si un comentario es spam, si insulta o si viene a
 * cuento — eso es moderación, tiene su propio criterio y puede equivocarse. Esto sólo deja el texto
 * en condiciones de ser juzgado.
 */
export function normalizeCommentText(raw: string): string {
  return (
    raw
      /* NFC junta «e» + acento en «é». Sin esto, el mismo «café» escrito de dos maneras son dos
         textos distintos para cualquier comparación que venga después. */
      .normalize("NFC")
      .replace(BIDI_CONTROLS, "")
      .replace(INVISIBLE_SEPARATORS, "")
      /* `\r\n` y `\r` a `\n`: Windows y lo pegado desde otras aplicaciones traen las tres formas.
         **Va antes de quitar los controles, y no después.** `\r` es `U+000D`, o sea uno de ellos:
         al revés se borraba en vez de convertirse, y dos renglones escritos en Windows se pegaban
         en uno solo. Lo encontró su prueba, no una revisión. */
      .replace(/\r\n?/g, "\n")
      .replace(CONTROL_CHARACTERS, "")
      .replace(NEWLINE_AVALANCHE, "\n\n")
      .trim()
  );
}
