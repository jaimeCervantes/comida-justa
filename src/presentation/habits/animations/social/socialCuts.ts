import { PILLARS_OVERVIEW_SCRIPT } from "../pillarsOverviewScript";
import { sceneStartMs, totalDurationMs } from "../playhead";

/** Los formatos de redes, en píxeles. */
export const SOCIAL_FORMATS = {
  vertical: { width: 1080, height: 1920 },
  cuadrado: { width: 1080, height: 1080 },
  horizontal: { width: 1920, height: 1080 },
} as const;

export type SocialFormat = keyof typeof SOCIAL_FORMATS;

/**
 * Las piezas que salen de la animación de los cuatro pilares: la completa y un corte por pilar.
 * Cada escena de pilar dura 16–22 s, que es lo que aguanta un video corto en redes.
 */
export const SOCIAL_CUTS = {
  completo: [0, 1, 2, 3, 4, 5],
  sueno: [1],
  alimentacion: [2],
  movimiento: [3],
  mente: [4],
} as const satisfies Record<string, readonly number[]>;

export type SocialCut = keyof typeof SOCIAL_CUTS;

/** El cierre de cada pieza: el logo y la dirección del sitio, para que se sepa adónde ir. */
export const OUTRO_MS = 3000;

export interface CutRange {
  fromMs: number;
  toMs: number;
  /** Duración total, con el cierre. */
  durationMs: number;
  sceneIndexes: readonly number[];
}

export function cutRange(cut: SocialCut): CutRange {
  const sceneIndexes = SOCIAL_CUTS[cut];
  const first = sceneIndexes[0];
  const last = sceneIndexes[sceneIndexes.length - 1];
  const fromMs = sceneStartMs(PILLARS_OVERVIEW_SCRIPT, first);
  const toMs =
    last === PILLARS_OVERVIEW_SCRIPT.length - 1
      ? totalDurationMs(PILLARS_OVERVIEW_SCRIPT)
      : sceneStartMs(PILLARS_OVERVIEW_SCRIPT, last + 1);
  return { fromMs, toMs, durationMs: toMs - fromMs + OUTRO_MS, sceneIndexes };
}

export function isSocialCut(value: string): value is SocialCut {
  return value in SOCIAL_CUTS;
}

export function isSocialFormat(value: string): value is SocialFormat {
  return value in SOCIAL_FORMATS;
}
