import type { OutreachListedProduct } from "./priceList";
import { buildPriceList, type ExcludedProduct } from "./priceList";

/** Lo que alguien escribió alrededor de la lista; la lista no se escribe, se arma. */
export interface OutreachTextContent {
  opening: string;
  closing: string;
}

/** Lo que necesita quien va a publicar: el texto listo y lo que se quedó fuera de él. */
export interface OutreachKit {
  /** Nulo cuando no queda nada disponible: no hay nada que anunciar, ni nada que copiar. */
  text: string | null;
  excluded: ExcludedProduct[];
}

/**
 * Los saltos de renglón como los entiende cualquiera que los pegue.
 *
 * Un `<textarea>` los envía como `\r\n` —lo manda la especificación de formularios, no el sistema
 * operativo— y los textos que vinieron del bot traen `\r` sueltos. Sin esto, la comparación con lo
 * que se ve en pantalla falla por caracteres que nadie ve.
 */
export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

/**
 * El texto completo para un grupo: lo de antes, la lista, un renglón vacío y lo de después.
 *
 * Lo de antes termina en la presentación de la lista («Pasa por el tuyo a Hazlo Sano:»), así que la
 * lista va pegada a ella; lo de después es otro párrafo. Sin renglones no hay texto: un anuncio sin
 * nada que vender no se publica.
 */
export function composeOutreachText(
  content: OutreachTextContent,
  lines: readonly string[],
): string | null {
  if (lines.length === 0) return null;

  const opening = normalizeNewlines(content.opening).trim();
  const closing = normalizeNewlines(content.closing).trim();
  const body = [opening, lines.join("\n")].filter(Boolean).join("\n");

  return closing ? `${body}\n\n${closing}` : body;
}

export function buildOutreachKit(
  content: OutreachTextContent,
  products: readonly OutreachListedProduct[],
): OutreachKit {
  const { lines, excluded } = buildPriceList(products);

  return { text: composeOutreachText(content, lines), excluded };
}
