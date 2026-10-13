import type { OutreachChannelFormat } from "~/domain/outreach/channelFormats";

/**
 * La clave del catálogo de cada tipo de grupo, escrita entera para que se encuentre con grep. Sin
 * directiva: la leen el formulario, que es de cliente, y el resumen, que se pinta en el servidor.
 */
export const CHANNEL_FORMAT_LABELS = {
  post: "formatPost",
  listing: "formatListing",
} as const satisfies Record<OutreachChannelFormat, string>;
