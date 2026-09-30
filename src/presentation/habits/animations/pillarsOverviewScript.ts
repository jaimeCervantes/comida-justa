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
 * El guion de la animación de los cuatro pilares (≈ 150 s).
 *
 * Cada pilar se cuenta en tres tiempos —antes, lo que cambió, el regreso—, siempre en ese orden,
 * para que a partir del segundo pilar quien mira ya sepa leer la estructura y solo reciba lo nuevo.
 * Por qué ese arco y no otro está en `docs/features/wellbeing/028-2026-09-29-animaciones-de-los-pilares.md`.
 *
 * **Cada duración sale de la narración**: lo que tarda el narrador en decir la frase (la más larga
 * de sus dos idiomas), más 0,35 s de entrada —el subtítulo empieza a escribirse antes que la voz—
 * y 0,65 s de respiro, redondeado a cuartos de segundo. Si cambia un texto, se vuelve a narrar con
 * `scripts/animations/generate-narration.mjs` y se vuelve a medir con `prepare-narration.mjs`
 * (proceso en `docs/features/wellbeing/028-2026-09-29-animaciones-de-los-pilares-sonido.md`). Las
 * escenas ilustradas y los subtítulos se sincronizan con estos mismos tiempos.
 */
export const PILLARS_OVERVIEW_SCRIPT: readonly OverviewScene[] = [
  { id: "intro", pillar: null, beatDurationsMs: [10250, 10000, 3750] },
  { id: "sleep", pillar: "sleep", beatDurationsMs: [9000, 13750, 11250] },
  {
    id: "nutrition",
    pillar: "nutrition",
    beatDurationsMs: [7500, 13500, 6250],
  },
  { id: "movement", pillar: "movement", beatDurationsMs: [9250, 10500, 5500] },
  {
    id: "mindSpirit",
    pillar: "mindSpirit",
    beatDurationsMs: [8750, 9000, 6250],
  },
  { id: "closing", pillar: null, beatDurationsMs: [11250, 6750] },
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

/** La etiqueta que va sobre el escenario de cada escena («Pilar 1 · Sueño»). */
export const OVERVIEW_CHIP_KEYS = {
  intro: "overview.intro.chip",
  sleep: "overview.sleep.chip",
  nutrition: "overview.nutrition.chip",
  movement: "overview.movement.chip",
  mindSpirit: "overview.mindSpirit.chip",
  closing: "overview.closing.chip",
} as const satisfies Record<OverviewSceneId, string>;
