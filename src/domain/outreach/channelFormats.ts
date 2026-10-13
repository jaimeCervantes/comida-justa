/**
 * Cómo se publica en un grupo. Lista cerrada en un solo archivo, con su etiqueta en
 * `es.json`/`en.json`; la base no lleva `CHECK`, como `posts.kind`, para que sumar un formato no
 * cueste una migración.
 */
export const OUTREACH_CHANNEL_FORMATS = [
  /** Grupo normal: un texto libre con fotos. La línea entera va en una publicación. */
  "post",
  /** Grupo de compraventa: «Vender artículo», con título, precio y descripción, uno por producto. */
  "listing",
] as const;

export type OutreachChannelFormat = (typeof OUTREACH_CHANNEL_FORMATS)[number];

export function isOutreachChannelFormat(
  value: unknown,
): value is OutreachChannelFormat {
  return OUTREACH_CHANNEL_FORMATS.includes(value as OutreachChannelFormat);
}
