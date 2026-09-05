import type { PillarKey } from "~/domain/pillars/pillarKey";

/**
 * Una práctica lista para enseñarse en una lista.
 *
 * Lleva las tres piezas que la convierten en un hábito y no en un consejo: **cuándo** (`cue`), **qué
 * basta** (`minimum`) y **qué la sostiene** (`studyCount`). Las tres pueden faltar, y cada ausencia
 * significa algo distinto — ver cada campo.
 */
export type PracticeCard = {
  key: string;
  title: string;
  summary: string;
  /** Cuándo y dónde. Nulo sólo si todavía no se le escribió ancla. */
  cue: string | null;
  /** Qué basta para que cuente. Nulo cuando la práctica entera ya es el mínimo. */
  minimum: string | null;
  /** Nulo cuando no se mide en minutos: un cuarto oscuro no dura nada, se es o no se es. */
  effortMinutes: number | null;
  /** 0 gratis · 1 poco · 2 compra. Nulo cuando no consta. */
  costLevel: number | null;
  /** Los pilares a los que sirve. El primero es el suyo, el de su portada. */
  pillars: readonly PillarKey[];
  /** Cuántos estudios la sostienen. Cero es una respuesta honesta, no un dato que falta. */
  studyCount: number;
  /** La clave del reto atómico, cuando esta práctica además es uno de los cuatro. */
  challengeKey: string | null;
};

/** El pilar del que esta práctica es portada. */
export function primaryPillarOf(practice: PracticeCard): PillarKey {
  return practice.pillars[0];
}

/**
 * Los pilares a los que sirve **además** del suyo.
 *
 * Es lo que hace visible que respirar despacio esté escrito una sola vez y sirva a dos pilares. Sin
 * enseñarlo, el modelo N:N es una decisión de base de datos que nadie ve.
 */
export function alsoServes(practice: PracticeCard): readonly PillarKey[] {
  return practice.pillars.slice(1);
}
