import type { PillarKey } from "~/domain/pillars/pillarKey";

/**
 * Una escena de una animación explicativa: a qué pilar pertenece (o a ninguno, como el gancho y el
 * cierre) y cuánto dura cada uno de sus subtítulos.
 *
 * La duración vive en el guion y no se deduce del texto porque el mismo guion se reproduce en
 * español y en inglés, y más adelante se exporta a video y se sincroniza con una locución: los
 * tiempos tienen que ser los mismos en los tres sitios.
 */
export interface AnimationScene {
  id: string;
  pillar: PillarKey | null;
  beatDurationsMs: readonly number[];
}

/** Dónde está la animación en un instante dado. */
export interface Playhead {
  sceneIndex: number;
  beatIndex: number;
  /** De 0 a 1: cuánto lleva recorrido de su escena. */
  sceneProgress: number;
  finished: boolean;
}

function sceneDurationMs(scene: AnimationScene): number {
  return scene.beatDurationsMs.reduce((sum, ms) => sum + ms, 0);
}

export function totalDurationMs(scenes: readonly AnimationScene[]): number {
  return scenes.reduce((sum, scene) => sum + sceneDurationMs(scene), 0);
}

export function sceneStartMs(
  scenes: readonly AnimationScene[],
  sceneIndex: number,
): number {
  return totalDurationMs(scenes.slice(0, sceneIndex));
}

/**
 * La escena y el subtítulo que tocan a los `elapsedMs` de haber empezado.
 *
 * Es una función pura del tiempo a propósito: el reproductor de la web, una exportación a video
 * cuadro por cuadro y una locución sincronizada tienen que coincidir, y solo coinciden si los tres
 * preguntan aquí. Pasado el final se queda en el último cuadro, que es donde está la invitación.
 */
export function playheadAt(
  scenes: readonly AnimationScene[],
  elapsedMs: number,
): Playhead {
  const total = totalDurationMs(scenes);
  const clamped = Math.min(Math.max(elapsedMs, 0), total);
  const finished = elapsedMs >= total;

  let sceneStart = 0;
  for (const [sceneIndex, scene] of scenes.entries()) {
    const duration = sceneDurationMs(scene);
    const isLast = sceneIndex === scenes.length - 1;
    if (clamped < sceneStart + duration || isLast) {
      const intoScene = clamped - sceneStart;
      return {
        sceneIndex,
        beatIndex: beatIndexAt(scene.beatDurationsMs, intoScene),
        sceneProgress: duration === 0 ? 1 : intoScene / duration,
        finished,
      };
    }
    sceneStart += duration;
  }

  return { sceneIndex: 0, beatIndex: 0, sceneProgress: 0, finished: true };
}

function beatIndexAt(beats: readonly number[], intoSceneMs: number): number {
  let beatStart = 0;
  for (const [beatIndex, duration] of beats.entries()) {
    if (intoSceneMs < beatStart + duration) return beatIndex;
    beatStart += duration;
  }
  return Math.max(beats.length - 1, 0);
}
