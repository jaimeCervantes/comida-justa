/**
 * Las ilustraciones se sirven tal cual (`images.unoptimized` en `next.config.mjs`), así que cada una
 * se preparó en tres anchos. En un teléfono el escenario es 4:3 y la imagen 16:9 se recorta por los
 * lados, por eso ocupa más del ancho de la pantalla (135vw) y no el 100vw que parecería.
 */
const WIDTHS = [960, 1440, 1920] as const;

export const ART_SIZES = "(min-width: 1024px) 960px, 135vw";

export function artSources(art: string): { src: string; srcSet: string } {
  return {
    src: `/animations/pilares/${art}-1440.webp`,
    srcSet: WIDTHS.map(
      (width) => `/animations/pilares/${art}-${width}.webp ${width}w`,
    ).join(", "),
  };
}

export function artFiles(art: string): string[] {
  return WIDTHS.map((width) => `animations/pilares/${art}-${width}.webp`);
}
