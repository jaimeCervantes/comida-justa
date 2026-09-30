import { Fragment, type ReactNode } from "react";
import { parseCaption } from "./captionMarkup";
import { MARK_LAG_MS, wordStaggerFor } from "./kineticTiming";
import styles from "./PillarAnimation.module.css";

/**
 * Un subtítulo que se escribe palabra por palabra, con la frase clave subrayada en el color del
 * pilar.
 *
 * Los espacios quedan como texto entre las palabras, no como margen: así el subtítulo se copia, se
 * lee en voz alta y se busca igual que un párrafo normal.
 */
export default function KineticCaption({
  markup,
  still = false,
}: {
  markup: string;
  /** Sin animación: el subtítulo ya escrito y subrayado (movimiento reducido). */
  still?: boolean;
}) {
  const parsed = parseCaption(markup);
  const wordCount = parsed.reduce(
    (count, segment) =>
      count + segment.text.split(/\s+/).filter(Boolean).length,
    0,
  );
  const stagger = wordStaggerFor(wordCount);
  let wordIndex = 0;
  const segments = parsed.map((segment, segmentIndex) => {
    const firstWord = wordIndex;
    const nodes: ReactNode[] = segment.text
      .split(/(\s+)/)
      .map((part, partIndex) => {
        if (part === "") return null;
        if (/^\s+$/.test(part)) return " ";
        const delay = wordIndex * stagger;
        wordIndex += 1;
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: el orden de las palabras es el texto mismo.
            key={partIndex}
            className={still ? undefined : styles.word}
            style={still ? undefined : { animationDelay: `${delay}ms` }}
          >
            {part}
          </span>
        );
      });
    if (!segment.highlight) {
      // biome-ignore lint/suspicious/noArrayIndexKey: los tramos no se reordenan.
      return <Fragment key={segmentIndex}>{nodes}</Fragment>;
    }
    return (
      <mark
        // biome-ignore lint/suspicious/noArrayIndexKey: los tramos no se reordenan.
        key={segmentIndex}
        className={still ? styles.markStill : styles.mark}
        style={
          still
            ? undefined
            : {
                animationDelay: `${firstWord * stagger + MARK_LAG_MS}ms`,
              }
        }
      >
        {nodes}
      </mark>
    );
  });
  return <p className="m-0">{segments}</p>;
}
