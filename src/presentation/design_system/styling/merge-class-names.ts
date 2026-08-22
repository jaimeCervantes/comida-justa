import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Los tamaños de fuente que este design system añade a la escala de Tailwind.
 *
 * Hay que declarárselos a `tailwind-merge` porque su desempate mira **el nombre de la clase**, no el
 * CSS generado: sin esta lista, `text-body` le parece un color de texto —igual que `text-red-500`—,
 * choca con `text-text-base` y descarta uno de los dos. El síntoma es un componente que se queda
 * literalmente sin clase de tamaño, y no lo ve nadie hasta que la página está en pantalla.
 *
 * Deben coincidir con los tokens `--text-*` declarados en `tokens/typography.css`, y ahora hay una
 * prueba que lo verifica: `fontSizeMerge.test.ts`. Faltaba `display` desde que el slice 10 lo
 * añadió, y el síntoma fue exactamente el que este comentario anunciaba — el titular de la portada
 * salía a tamaño de cuerpo, con `text-display` descartado del `class` y sin que nada fallara.
 */
const FONT_SIZES = [
  "tiny",
  "caption",
  "label",
  "body",
  "body-lg",
  "heading-sm",
  "heading-md",
  "heading-lg",
  "display",
] as const;

/**
 * Los colores de texto semánticos. Sin declararlos, `text-text-support` y `text-pillar-sleep-ink`
 * se tratan como clases desconocidas y dejan de desempatar entre sí.
 */
const TEXT_COLORS = [
  "text-base",
  "text-inverse",
  "text-support",
  "text-muted",
  "highlight",
  "pillar-sleep-ink",
  "pillar-nutrition-ink",
  "pillar-movement-ink",
  "pillar-mind-spirit-ink",
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...FONT_SIZES] }],
      "text-color": [{ text: [...TEXT_COLORS] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
