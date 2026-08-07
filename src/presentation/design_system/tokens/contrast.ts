/**
 * Contraste WCAG 2.1 sobre colores en hexadecimal.
 *
 * Los mensajes de error van en inglés, como los de `GeminiEmbeddingService` y
 * `TranslationProviderError`: los lee quien programa al romper un token, nunca un visitante. Un
 * comentario en español es documentación; un `throw` en español parece interfaz sin serlo.
 *
 * Vive en el design system y no en un helper de pruebas porque el contraste es una **propiedad del
 * token**, no del test que lo mira: la paleta de los pilares se derivó bajando la luminosidad de
 * cada semilla de marca hasta cruzar 4.5:1, y sin esta función ese cálculo no se puede repetir ni
 * defender cuando alguien retoque un hex.
 */

const AA_NORMAL_TEXT = 4.5;

/** Umbral AA para texto normal. Texto grande (≥18.66px bold o ≥24px) se conforma con 3. */
export const AA_THRESHOLD = AA_NORMAL_TEXT;

type Rgb = readonly [number, number, number];

/** Acepta `#rgb` y `#rrggbb`, con o sin `#`. Devuelve canales normalizados a 0..1. */
export function parseHex(hex: string): Rgb {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Not a valid hex colour: "${hex}"`);
  }

  return [0, 2, 4].map(
    (i) => Number.parseInt(full.slice(i, i + 2), 16) / 255,
  ) as unknown as Rgb;
}

/** Linealización sRGB previa a la luminancia relativa (WCAG 2.1, §relative luminance). */
function toLinear(channel: number): number {
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razón de contraste entre dos colores. Simétrica: el orden de los argumentos da igual. */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsAA(a: string, b: string): boolean {
  return contrastRatio(a, b) >= AA_THRESHOLD;
}

/**
 * Extrae las custom properties de una hoja de estilos como pares `nombre → valor`.
 *
 * Sirve para que las pruebas midan el contraste **del CSS que se publica**, no de una copia en
 * TypeScript que se desincroniza en cuanto alguien edita el token y se olvida del espejo.
 *
 * `scope` recorta a un bloque concreto (`:root`, `@media (prefers-color-scheme: dark)`), porque la
 * misma variable existe dos veces con valores distintos y medirlas juntas no significa nada.
 */
export function readCssVariables(
  css: string,
  options: { readonly startAfter?: string; readonly stopAt?: string } = {},
): Record<string, string> {
  const from = options.startAfter ? css.indexOf(options.startAfter) : 0;
  if (from < 0) {
    throw new Error(
      `Block not found in the stylesheet: "${options.startAfter}"`,
    );
  }

  const rest = css.slice(from);
  const to = options.stopAt ? rest.indexOf(options.stopAt) : -1;
  const scoped = to > 0 ? rest.slice(0, to) : rest;

  const variables: Record<string, string> = {};
  for (const [, name, value] of scoped.matchAll(
    /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi,
  )) {
    variables[name] = value.trim();
  }
  return variables;
}
