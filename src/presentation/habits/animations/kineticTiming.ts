/**
 * Los tiempos del subtítulo cinético, en un solo sitio: los usan el subtítulo de la web (con
 * animaciones CSS) y el del video (calculado cuadro a cuadro), y tienen que coincidir.
 *
 * Las duraciones de entrada también están escritas en `PillarAnimation.module.css` (`wordIn` y
 * `markIn`); si cambian aquí, cambian allí.
 */

/** Cuánto espera cada palabra a la anterior: lo bastante para leerse como voz, no como parpadeo. */
export const WORD_STAGGER_MS = 55;
/** …pero la frase entera entra en poco más de un segundo, por larga que sea. */
export const MAX_STAGGER_TOTAL_MS = 1100;
/** El subrayado de la frase clave llega cuando sus palabras ya están en su sitio. */
export const MARK_LAG_MS = 450;
/** Lo que tarda cada palabra en asentarse. */
export const WORD_IN_MS = 760;
/** Lo que tarda el subrayado en recorrer la frase clave. */
export const MARK_IN_MS = 900;

export function wordStaggerFor(wordCount: number): number {
  return Math.min(
    WORD_STAGGER_MS,
    MAX_STAGGER_TOTAL_MS / Math.max(wordCount, 1),
  );
}
