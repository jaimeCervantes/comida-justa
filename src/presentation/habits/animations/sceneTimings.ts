import { type AnimationScene, sceneStartMs } from "./playhead";
import type { SceneTiming } from "./scenes/useSceneTimeline";

/**
 * Los tiempos de cada escena de un guion: dónde empieza dentro de la animación y dónde empieza cada
 * uno de sus subtítulos. Salen del guion una sola vez y los usan el reproductor de la web y la
 * exportación a video, que tienen que coincidir cuadro a cuadro.
 */
export function sceneTimingsOf(
  script: readonly AnimationScene[],
): readonly SceneTiming[] {
  return script.map((scene, index) => {
    const beatsSec: number[] = [];
    let cursor = 0;
    for (const ms of scene.beatDurationsMs) {
      beatsSec.push(cursor);
      cursor += ms / 1000;
    }
    return {
      startMs: sceneStartMs(script, index),
      beatsSec,
      durationSec: cursor,
    };
  });
}
