/**
 * La forma de un chip de filtro: una sola, para que los que van en la misma fila se lean como un
 * grupo y no como dos controles que coincidieron.
 *
 * El color y el estado los decide cada uno —los pilares llevan el suyo—; lo que no se decide dos
 * veces es el alto, el radio y el relleno, que es justo lo que se nota cuando difiere.
 *
 * `shrink-0` para las filas deslizables (la barra del chrome, `ListingFilterBar`): sin él los chips
 * se comprimirían hasta partir su etiqueta en vez de salirse y dejarse arrastrar.
 */
export const FILTER_CHIP =
  "focus-ring inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors";

/** Encendido: el verde de la marca. Lo comparten «Todo» y los interruptores. */
export const CHIP_ON = "border-pw-green bg-pw-green text-white";

export const CHIP_OFF =
  "border-separator bg-surface-elevation-1 text-text-base hover:bg-surface-elevation-2";
