import { parseCaption } from "../captionMarkup";
import {
  MARK_IN_MS,
  MARK_LAG_MS,
  WORD_IN_MS,
  wordStaggerFor,
} from "../kineticTiming";

/** Una palabra del subtítulo en un instante: de 0 (aún no entra) a 1 (ya en su sitio). */
export interface FrameWord {
  text: string;
  progress: number;
}

/** Un tramo del subtítulo, con sus palabras y, si es la frase clave, cuánto va su subrayado. */
export interface FrameSegment {
  highlight: boolean;
  markProgress: number;
  parts: (FrameWord | " ")[];
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Cómo se ve un subtítulo a los `elapsedMs` de haber empezado.
 *
 * Es el mismo subtítulo cinético de la web, pero calculado y no animado con CSS: una animación CSS
 * corre con el reloj del navegador, y en una exportación cuadro a cuadro cada captura cae en un
 * momento distinto. Así el cuadro 312 es el mismo en cada exportación.
 */
export function captionAt(markup: string, elapsedMs: number): FrameSegment[] {
  const segments = parseCaption(markup);
  const wordCount = segments.reduce(
    (count, segment) =>
      count + segment.text.split(/\s+/).filter(Boolean).length,
    0,
  );
  const stagger = wordStaggerFor(wordCount);
  let wordIndex = 0;
  return segments.map((segment) => {
    const firstWord = wordIndex;
    const parts: (FrameWord | " ")[] = [];
    for (const piece of segment.text.split(/(\s+)/)) {
      if (piece === "") continue;
      if (/^\s+$/.test(piece)) {
        parts.push(" ");
        continue;
      }
      const delay = wordIndex * stagger;
      wordIndex += 1;
      parts.push({
        text: piece,
        progress: clamp((elapsedMs - delay) / WORD_IN_MS),
      });
    }
    const markStart = firstWord * stagger + MARK_LAG_MS;
    return {
      highlight: segment.highlight,
      markProgress: segment.highlight
        ? clamp((elapsedMs - markStart) / MARK_IN_MS)
        : 0,
      parts,
    };
  });
}

/** La curva de entrada de las palabras: rápida al principio, suave al llegar. */
export function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 3;
}
