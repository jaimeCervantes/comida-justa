import { sceneStartMs, totalDurationMs } from "../playhead";
import type { Film } from "./films";

/** Los formatos de redes, en píxeles. */
export const SOCIAL_FORMATS = {
  vertical: { width: 1080, height: 1920 },
  cuadrado: { width: 1080, height: 1080 },
  horizontal: { width: 1920, height: 1080 },
} as const;

export type SocialFormat = keyof typeof SOCIAL_FORMATS;

/** El cierre de cada pieza: el logo y la dirección del sitio, para que se sepa adónde ir. */
export const OUTRO_MS = 3000;

export interface CutRange {
  fromMs: number;
  toMs: number;
  /** Duración total, con el cierre. */
  durationMs: number;
  sceneIndexes: readonly number[];
}

/** Dónde empieza y dónde acaba un corte dentro de su animación, y cuánto dura con el cierre. */
export function cutRange(film: Film, cut: string): CutRange {
  const sceneIndexes = film.cuts[cut];
  if (!sceneIndexes) throw new Error(`Corte desconocido: ${cut}`);
  const first = sceneIndexes[0];
  const last = sceneIndexes[sceneIndexes.length - 1];
  const fromMs = sceneStartMs(film.script, first);
  const toMs =
    last === film.script.length - 1
      ? totalDurationMs(film.script)
      : sceneStartMs(film.script, last + 1);
  return { fromMs, toMs, durationMs: toMs - fromMs + OUTRO_MS, sceneIndexes };
}

/** Un subtítulo del corte: su clave (`sleep.b2`, la de su texto y su narración) y cuándo empieza. */
export interface CutBeat {
  key: string;
  /** Milisegundos desde el inicio del corte. */
  startMs: number;
}

/**
 * Dónde empieza cada subtítulo de un corte, medido desde el inicio del corte. La mezcla de sonido
 * pone ahí la narración de cada uno.
 */
export function cutBeats(film: Film, range: CutRange): CutBeat[] {
  return range.sceneIndexes.flatMap((sceneIndex) => {
    const scene = film.script[sceneIndex];
    let cursor = sceneStartMs(film.script, sceneIndex) - range.fromMs;
    return scene.beatDurationsMs.map((ms, beatIndex) => {
      const beat = { key: `${scene.id}.b${beatIndex + 1}`, startMs: cursor };
      cursor += ms;
      return beat;
    });
  });
}

export function isSocialCut(film: Film, value: string): boolean {
  return value in film.cuts;
}

export function isSocialFormat(value: string): value is SocialFormat {
  return value in SOCIAL_FORMATS;
}
