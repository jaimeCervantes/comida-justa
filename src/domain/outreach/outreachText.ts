import type { OutreachListedProduct } from "./priceList";
import { buildPriceList, type ExcludedProduct } from "./priceList";

/** Lo que alguien escribió alrededor de la lista; la lista no se escribe, se arma. */
export interface OutreachTextContent {
  opening: string;
  closing: string;
  /** El pie compartido que lleva este texto, si lleva uno: va al final, después de lo de después. */
  footer?: string | null;
}

/** Un texto con todas sus formas de empezar: la primera versión y las demás, en orden. */
export interface OutreachKitContent {
  opening: string;
  /** Las otras versiones de lo que va antes de la lista; vacío si solo hay una. */
  versions?: readonly string[];
  closing: string;
  footer?: string | null;
}

/** Lo que necesita quien va a publicar: el texto listo y lo que se quedó fuera de él. */
export interface OutreachKit {
  /** La primera versión. Nulo cuando no queda nada disponible: no hay nada que anunciar. */
  text: string | null;
  /** El texto armado de cada versión, la primera incluida; vacío si no hay nada que anunciar. */
  versions: string[];
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
 * El texto completo para un grupo: lo de antes, la lista, y después cada párrafo que haya —lo de
 * después y el pie—, separados por un renglón vacío.
 *
 * Lo de antes termina en la presentación de la lista («Pasa por el tuyo a Hazlo Sano:»), así que la
 * lista va pegada a ella. Sin renglones no hay texto: un anuncio sin nada que vender no se publica.
 */
export function composeOutreachText(
  content: OutreachTextContent,
  lines: readonly string[],
): string | null {
  if (lines.length === 0) return null;

  const opening = normalizeNewlines(content.opening).trim();
  const body = [opening, lines.join("\n")].filter(Boolean).join("\n");
  const after = [content.closing, content.footer ?? ""]
    .map((paragraph) => normalizeNewlines(paragraph).trim())
    .filter(Boolean);

  return [body, ...after].join("\n\n");
}

/**
 * El texto de cada versión con la lista de hoy. Todas comparten la lista, lo de después y el pie:
 * lo único que cambia es cómo empiezan, que es lo que hace que dos grupos no reciban el mismo texto.
 */
export function buildOutreachKit(
  content: OutreachKitContent,
  products: readonly OutreachListedProduct[],
): OutreachKit {
  const { lines, excluded } = buildPriceList(products);
  const openings = [content.opening, ...(content.versions ?? [])];
  const versions = openings.flatMap((opening) => {
    const text = composeOutreachText(
      { opening, closing: content.closing, footer: content.footer },
      lines,
    );

    return text === null ? [] : [text];
  });

  return { text: versions[0] ?? null, versions, excluded };
}
