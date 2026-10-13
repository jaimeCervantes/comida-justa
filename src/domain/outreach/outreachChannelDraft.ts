import {
  isOutreachChannelFormat,
  type OutreachChannelFormat,
} from "./channelFormats";

/** Lo que manda el formulario de un grupo, tal cual. */
export interface OutreachChannelDraft {
  name: string;
  url: string;
  format: string;
  minDaysBetween: string;
  notes: string;
}

/** Un grupo listo para guardarse: nombre y reglas recortados, dirección completa, días enteros. */
export interface OutreachChannelInput {
  name: string;
  url: string;
  format: OutreachChannelFormat;
  /** Cada cuántos días acepta una publicación de la misma persona. 0 = sin límite. */
  minDaysBetween: number;
  notes: string;
}

/** Códigos y no frases: el mensaje lo pone el catálogo del idioma de quien llena el formulario. */
export interface OutreachChannelErrors {
  name?: "required";
  url?: "invalid";
  format?: "invalid";
  minDaysBetween?: "out-of-range";
}

export type ChannelValidation =
  | { channel: OutreachChannelInput; errors?: undefined }
  | { channel?: undefined; errors: OutreachChannelErrors };

/** Un año: más que eso no es un ritmo, es un grupo al que ya no se publica. */
export const MAX_MIN_DAYS_BETWEEN = 365;

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * La dirección completa de un grupo, o nulo si no es una que se pueda abrir.
 *
 * Se acepta sin `https://` porque así se copia muchas veces de la barra del teléfono, y se completa.
 * Lo que sí se rechaza es cualquier otro esquema: la dirección se pinta como enlace, y un
 * `javascript:` ahí correría código en la sesión del administrador.
 */
export function normalizeChannelUrl(raw: string): string | null {
  const trimmed = raw.trim();

  if (!trimmed || /\s/.test(trimmed)) return null;

  const candidate = HAS_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);

    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".")) return null;

    return url.toString();
  } catch {
    return null;
  }
}

function parseMinDays(raw: string): number | null {
  const text = raw.trim();

  if (!/^\d+$/.test(text)) return null;

  const days = Number(text);

  return days <= MAX_MIN_DAYS_BETWEEN ? days : null;
}

/** Todo lo que falta, a la vez; o el grupo ya limpio para guardarse. */
export function validateOutreachChannelDraft(
  draft: OutreachChannelDraft,
): ChannelValidation {
  const errors: OutreachChannelErrors = {};
  const name = draft.name.trim();
  const url = normalizeChannelUrl(draft.url);
  const format = isOutreachChannelFormat(draft.format) ? draft.format : null;
  const minDaysBetween = parseMinDays(draft.minDaysBetween);

  if (!name) errors.name = "required";
  if (url === null) errors.url = "invalid";
  if (format === null) errors.format = "invalid";
  if (minDaysBetween === null) errors.minDaysBetween = "out-of-range";

  if (!name || url === null || format === null || minDaysBetween === null) {
    return { errors };
  }

  return {
    channel: {
      name,
      url,
      format,
      minDaysBetween,
      notes: draft.notes.replace(/\r\n?/g, "\n").trim(),
    },
  };
}
