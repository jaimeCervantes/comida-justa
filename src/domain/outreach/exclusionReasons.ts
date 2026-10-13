/**
 * Por qué un producto ligado a un texto de difusión no sale en su lista de precios.
 *
 * Lista cerrada en un solo archivo: cada motivo tiene su etiqueta en `es.json`/`en.json`. El orden
 * importa —gana el primero que aplique— porque a quien lee el aviso le sirve la causa de fondo: un
 * pan en revisión que además se agotó está, antes que nada, en revisión, y reponerlo no lo haría
 * aparecer.
 */
export const OUTREACH_EXCLUSION_REASONS = [
  /** En revisión o rechazado: anunciarlo mandaría al comprador a una página que no existe. */
  "not-published",
  /** Lleva inventario y llegó a cero. */
  "out-of-stock",
  /** No lleva inventario y alguien lo apagó a mano. */
  "unavailable",
  /** Una lista de precios no tiene qué decir de algo sin precio. */
  "no-price",
] as const;

export type OutreachExclusionReason =
  (typeof OUTREACH_EXCLUSION_REASONS)[number];
