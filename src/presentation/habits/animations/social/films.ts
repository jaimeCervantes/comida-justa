import { OVERVIEW_SCENES } from "../overviewScenes";
import { OVERVIEW_TIMINGS } from "../overviewTimings";
import {
  type OverviewSceneId,
  PILLARS_OVERVIEW_SCRIPT,
} from "../pillarsOverviewScript";
import type { AnimationScene } from "../playhead";
import type { IllustratedSceneConfig } from "../scenes/IllustratedScene";
import type { SceneTiming } from "../scenes/useSceneTimeline";
import { MIND_SPIRIT_STORY } from "../stories/mindSpiritStory";
import { MOVEMENT_STORY } from "../stories/movementStory";
import { NUTRITION_STORY } from "../stories/nutritionStory";
import { type PillarStory, storyTimings } from "../stories/pillarStory";
import { SLEEP_STORY } from "../stories/sleepStory";

/** Una animación tal como la necesita la composición para redes. */
export interface Film {
  script: readonly AnimationScene[];
  /** Lo que se ve en cada escena, en el orden del guion. */
  scenes: readonly IllustratedSceneConfig[];
  timings: readonly SceneTiming[];
  /** El color de la etiqueta y del subrayado de cada escena, sobre el fondo oscuro del video. */
  accents: readonly string[];
  /** Las piezas que salen de ella, como índices de escena. Siempre está la completa. */
  cuts: { completo: readonly number[] } & Record<string, readonly number[]>;
}

/** El color de cada escena de los cuatro pilares: el de su pilar; el gancho y el cierre, la marca. */
const OVERVIEW_ACCENTS: Record<OverviewSceneId, string> = {
  intro: "#fb923c",
  sleep: "#a78bfa",
  nutrition: "#fb923c",
  movement: "#4ade80",
  mindSpirit: "#38bdf8",
  closing: "#4ade80",
};

/** Las animaciones de cada pilar, por el nombre con que se exportan (`--animacion=sueno`). */
export const STORY_FILMS = {
  sueno: SLEEP_STORY,
  alimentacion: NUTRITION_STORY,
  movimiento: MOVEMENT_STORY,
  mente: MIND_SPIRIT_STORY,
} satisfies Record<string, PillarStory>;

/** La animación de un pilar sale entera, con el color de su pilar en todas las escenas. */
function storyFilm(story: PillarStory): Film {
  return {
    script: story.script,
    scenes: story.script.map((scene) => story.scenes[scene.id]),
    timings: storyTimings(story),
    accents: story.script.map(() => story.videoAccent),
    cuts: { completo: story.script.map((_, index) => index) },
  };
}

/**
 * Las animaciones que se exportan a video. `pilares` es la de los cuatro pilares, con la completa
 * y un corte por pilar (cada escena de pilar cabe en un video corto); las de cada pilar salen
 * enteras.
 */
export const FILMS = {
  pilares: {
    script: PILLARS_OVERVIEW_SCRIPT,
    scenes: PILLARS_OVERVIEW_SCRIPT.map((scene) => OVERVIEW_SCENES[scene.id]),
    timings: OVERVIEW_TIMINGS,
    accents: PILLARS_OVERVIEW_SCRIPT.map((scene) => OVERVIEW_ACCENTS[scene.id]),
    cuts: {
      completo: [0, 1, 2, 3, 4, 5],
      sueno: [1],
      alimentacion: [2],
      movimiento: [3],
      mente: [4],
    },
  },
  sueno: storyFilm(SLEEP_STORY),
  alimentacion: storyFilm(NUTRITION_STORY),
  movimiento: storyFilm(MOVEMENT_STORY),
  mente: storyFilm(MIND_SPIRIT_STORY),
} satisfies Record<string, Film>;

export type FilmId = keyof typeof FILMS;

export function isFilmId(value: string): value is FilmId {
  return value in FILMS;
}
