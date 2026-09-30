import { PILLARS_OVERVIEW_SCRIPT } from "./pillarsOverviewScript";
import { sceneStartMs } from "./playhead";
import type { SceneTiming } from "./scenes/useSceneTimeline";

/**
 * Los tiempos de cada escena de la animación de los cuatro pilares, sacados del guion una sola vez:
 * los usan el reproductor de la web y la exportación a video, y tienen que ser los mismos.
 */
export const OVERVIEW_TIMINGS: readonly SceneTiming[] =
  PILLARS_OVERVIEW_SCRIPT.map((scene, index) => {
    const beatsSec: number[] = [];
    let cursor = 0;
    for (const ms of scene.beatDurationsMs) {
      beatsSec.push(cursor);
      cursor += ms / 1000;
    }
    return {
      startMs: sceneStartMs(PILLARS_OVERVIEW_SCRIPT, index),
      beatsSec,
      durationSec: cursor,
    };
  });
