/**
 * El marcado de los subtítulos: texto plano con la frase clave entre `<hl>` y `</hl>`.
 *
 * La marca vive en el catálogo de traducción y no en el componente porque la frase que importa
 * cambia de sitio con el idioma: en inglés el énfasis cae en otras palabras que en español.
 */
export interface CaptionSegment {
  text: string;
  highlight: boolean;
}

const HIGHLIGHT = /<hl>(.*?)<\/hl>/g;

export function parseCaption(markup: string): CaptionSegment[] {
  const segments: CaptionSegment[] = [];
  let cursor = 0;
  for (const match of markup.matchAll(HIGHLIGHT)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      segments.push({ text: markup.slice(cursor, start), highlight: false });
    }
    segments.push({ text: match[1], highlight: true });
    cursor = start + match[0].length;
  }
  if (cursor < markup.length) {
    segments.push({ text: markup.slice(cursor), highlight: false });
  }
  /* La puntuación pegada a la frase clave («…<hl>dormíamos</hl>. El sol») se queda con ella.
     Cada palabra se dibuja como un bloque en línea para poder animarla, y después de un bloque
     el navegador siempre puede partir la línea: el punto acababa solo al principio del renglón
     siguiente. Dentro de la frase clave va subrayado con ella, como con un marcatexto. */
  for (let index = 1; index < segments.length; index++) {
    const previous = segments[index - 1];
    const segment = segments[index];
    const punctuation = segment.text.match(/^[^\s\p{L}\p{N}]+/u)?.[0];
    if (previous.highlight && !segment.highlight && punctuation) {
      previous.text += punctuation;
      segment.text = segment.text.slice(punctuation.length);
    }
  }
  return segments.filter((segment) => segment.text.length > 0);
}

/** El subtítulo tal como se lee, sin marcas. */
export function captionPlainText(markup: string): string {
  return markup.replace(/<\/?hl>/g, "");
}
