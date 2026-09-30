import type { PillarKey } from "~/domain/pillars/pillarKey";
import type { AnimationMessageKey } from "../animationMessages";
import type { SceneLook } from "../PillarAnimationPlayer";
import type { AnimationScene } from "../playhead";
import type { IllustratedSceneConfig } from "../scenes/IllustratedScene";
import type { SceneTiming } from "../scenes/useSceneTimeline";
import { sceneTimingsOf } from "../sceneTimings";

/**
 * Los cinco tiempos en que se cuenta cada pilar en su propia animación, siempre en este orden:
 * cómo era antes, qué cambió, qué nos cuesta, qué lo compensa y la versión mínima de su práctica.
 * Es el arco de la animación de los cuatro pilares (antes, lo que cambió, el regreso) con el costo
 * y la práctica que allí no caben; quien la ve ya eligió ese pilar.
 */
export type StorySceneId =
  | "before"
  | "change"
  | "cost"
  | "counterweight"
  | "practice";

export interface StoryScene extends AnimationScene {
  id: StorySceneId;
}

/**
 * La animación de un pilar: su guion, lo que se ve en cada escena y dónde están sus textos.
 *
 * Todo es dato y nada es vocabulario del reproductor: el mismo `IllustratedAnimation` cuenta
 * cualquier pilar, y la exportación a video también.
 */
export interface PillarStory {
  pillar: PillarKey;
  /** El de «ya la vi» y el de la medición. */
  animationId: string;
  /** La página del pilar donde vive, como va en la ruta: `sueno`. */
  slug: string;
  script: readonly StoryScene[];
  scenes: Record<StorySceneId, IllustratedSceneConfig>;
  captionKeys: Record<StorySceneId, readonly AnimationMessageKey[]>;
  chipKeys: Record<StorySceneId, AnimationMessageKey>;
  regionLabelKey: AnimationMessageKey;
  looks: Record<StorySceneId, Omit<SceneLook, "chip">>;
  /** El color de la etiqueta y del subrayado en el video, sobre fondo oscuro. */
  videoAccent: string;
  /**
   * La pista de sonido de la web, sin el idioma: `/animations/pilares/sonido-sueno`. Sin ella, la
   * animación va solo con texto y sin botón de sonido: la voz de un pilar puede llegar después.
   */
  soundtrackBase?: string;
}

/** Las ilustraciones de una animación, en orden de aparición: para precargarlas. */
export function storyArts(story: PillarStory): readonly string[] {
  return story.script.flatMap((scene) =>
    story.scenes[scene.id].beats.map((beat) => beat.art),
  );
}

const timingsCache = new WeakMap<PillarStory, readonly SceneTiming[]>();

/**
 * Los tiempos de cada escena de una animación, calculados una sola vez: el reproductor y las
 * escenas los comparan por identidad, y recalcularlos en cada render reiniciaría sus líneas de
 * tiempo.
 */
export function storyTimings(story: PillarStory): readonly SceneTiming[] {
  let timings = timingsCache.get(story);
  if (!timings) {
    timings = sceneTimingsOf(story.script);
    timingsCache.set(story, timings);
  }
  return timings;
}
