import type { AnimationScene } from "./playhead";

/** Las escenas de la animación de los cuatro pilares; también son sus claves de traducción. */
export type OverviewSceneId =
  | "intro"
  | "sleep"
  | "nutrition"
  | "movement"
  | "mindSpirit"
  | "closing";

interface OverviewScene extends AnimationScene {
  id: OverviewSceneId;
}

/**
 * El guion de la animación de los cuatro pilares (≈ 100 s).
 *
 * Cada pilar se cuenta en tres tiempos —antes, lo que cambió, el regreso—, siempre en ese orden,
 * para que a partir del segundo pilar quien mira ya sepa leer la estructura y solo reciba lo nuevo.
 * Por qué ese arco y no otro está en `docs/features/wellbeing/028-2026-09-29-animaciones-de-los-pilares.md`.
 *
 * Cada duración es ~250 ms por palabra del texto en español más 1,5 s de aire: lo que tarda en
 * leerse a un ritmo cómodo. El inglés es algo más corto y cabe holgado.
 */
export const PILLARS_OVERVIEW_SCRIPT: readonly OverviewScene[] = [
  { id: "intro", pillar: null, beatDurationsMs: [6500, 7500, 3500] },
  { id: "sleep", pillar: "sleep", beatDurationsMs: [6250, 9000, 6500] },
  { id: "nutrition", pillar: "nutrition", beatDurationsMs: [6750, 8500, 4500] },
  { id: "movement", pillar: "movement", beatDurationsMs: [5500, 7000, 4500] },
  {
    id: "mindSpirit",
    pillar: "mindSpirit",
    beatDurationsMs: [5500, 6000, 4500],
  },
  { id: "closing", pillar: null, beatDurationsMs: [7000, 5000] },
];

/**
 * Las claves de traducción de los subtítulos de cada escena, en el orden en que se dicen.
 *
 * Van escritas enteras, no armadas con plantilla: así `next-intl` comprueba en compilación que cada
 * una existe, y `pillarsOverviewScript.test.ts` que hay una por cada duración del guion.
 */
export const OVERVIEW_CAPTION_KEYS = {
  intro: ["overview.intro.b1", "overview.intro.b2", "overview.intro.b3"],
  sleep: ["overview.sleep.b1", "overview.sleep.b2", "overview.sleep.b3"],
  nutrition: [
    "overview.nutrition.b1",
    "overview.nutrition.b2",
    "overview.nutrition.b3",
  ],
  movement: [
    "overview.movement.b1",
    "overview.movement.b2",
    "overview.movement.b3",
  ],
  mindSpirit: [
    "overview.mindSpirit.b1",
    "overview.mindSpirit.b2",
    "overview.mindSpirit.b3",
  ],
  closing: ["overview.closing.b1", "overview.closing.b2"],
} as const satisfies Record<OverviewSceneId, readonly string[]>;
