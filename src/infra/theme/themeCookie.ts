/**
 * El nombre y el formato de la cookie, sin `next/headers`.
 *
 * `ThemeToggle` es un Client Component y necesita `THEME_COOKIE`/`THEME_COOKIE_MAX_AGE` para
 * escribirla; si este módulo importara `cookies()` de `next/headers` —como hacía antes—, ese
 * import arrastraría al cliente una API que solo existe en el servidor y el build reventaría. Es
 * el mismo defecto que ya documentó `PillarLocalSection` con `next-auth`: una constante no puede
 * traer una capa detrás. El lector que sí llama a `cookies()` vive en `readThemePreference.ts`.
 */

/** La comparte el navegador y la lee el servidor: por eso una cookie y no `localStorage` — el
 * `<html>` tiene que nacer ya en el tema correcto, sin un script que lo corrija después del primer
 * pintado. */
export const THEME_COOKIE = "hs_theme";

/** Un año, igual que la de ubicación: una preferencia de tema no caduca sola. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Sin cookie, el sitio sigue al sistema operativo — ese es el comportamiento de siempre y no una
 * tercera opción que alguien tenga que elegir. `light`/`dark` son la preferencia explícita que
 * gana sobre el sistema; no hay un tercer valor guardado para "automático", volver ahí es borrar la
 * cookie.
 */
export type ThemePreference = "light" | "dark";

/** Cualquiera puede escribir una cookie: lo que no sea exactamente uno de los dos valores se trata
 * como si no hubiera cookie, en vez de reventar. */
export function parseThemePreference(
  raw: string | null | undefined,
): ThemePreference | null {
  return raw === "light" || raw === "dark" ? raw : null;
}
