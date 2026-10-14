/** Los dos números del ritmo: cuántas publicaciones al día antes de avisar, y cuánto descansar. */
export interface OutreachRhythm {
  dailyLimit: number;
  /** 0 apaga la pausa. */
  pauseMinutes: number;
}

/**
 * Los valores por omisión, prudentes para una cuenta personal que publica a mano.
 *
 * **No son cifras de Facebook**: Meta no publica ningún límite, y lo que dispara su detección de
 * spam depende de la cuenta. Por eso se pueden mover por entorno sin tocar código.
 */
export const DEFAULT_OUTREACH_RHYTHM: OutreachRhythm = {
  dailyLimit: 10,
  pauseMinutes: 10,
};

/** Hasta dónde se acepta cada uno: más allá ya no es un ritmo, es un error de dedo. */
const RANGES: Record<keyof OutreachRhythm, { min: number; max: number }> = {
  /** Un tope de 0 avisaría siempre: no sirve, así que el mínimo es 1. */
  dailyLimit: { min: 1, max: 200 },
  /** 0 apaga la pausa; cuatro horas es más que una tarde. */
  pauseMinutes: { min: 0, max: 240 },
};

export interface ResolvedOutreachRhythm {
  rhythm: OutreachRhythm;
  /** Lo que venía escrito pero no se pudo usar: quien lee la configuración debe avisarlo. */
  rejected: Array<keyof OutreachRhythm>;
}

/**
 * El ritmo a partir de lo que diga el entorno, campo por campo.
 *
 * Lo que no viene se queda en su valor por omisión sin más; lo que viene mal —«10m», «diez», 500—
 * también, pero se reporta en `rejected`, para que una errata en la configuración no pase en
 * silencio. No usa `Number(x) || omisión`, el patrón de `src/infra/constants`: ahí un 0 caería al
 * valor por omisión, y una pausa de 0 es justo la forma de apagarla.
 */
export function resolveOutreachRhythm(raw: {
  dailyLimit?: string;
  pauseMinutes?: string;
}): ResolvedOutreachRhythm {
  const rhythm = { ...DEFAULT_OUTREACH_RHYTHM };
  const rejected: Array<keyof OutreachRhythm> = [];

  for (const field of Object.keys(RANGES) as Array<keyof OutreachRhythm>) {
    const text = raw[field]?.trim();

    if (!text) continue;

    const value = /^\d+$/.test(text) ? Number(text) : Number.NaN;
    const { min, max } = RANGES[field];

    if (Number.isInteger(value) && value >= min && value <= max) {
      rhythm[field] = value;
    } else {
      rejected.push(field);
    }
  }

  return { rhythm, rejected };
}
