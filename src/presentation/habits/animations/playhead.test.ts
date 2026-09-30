import { describe, expect, it } from "vitest";
import {
  type AnimationScene,
  playheadAt,
  sceneStartMs,
  totalDurationMs,
} from "./playhead";

/** El guion del escenario `@component` de `animacionesPilares.feature`: 6000, 6000 y 8000 ms. */
const SCENES: readonly AnimationScene[] = [
  { id: "a", pillar: null, beatDurationsMs: [6000] },
  { id: "b", pillar: "sleep", beatDurationsMs: [6000] },
  { id: "c", pillar: null, beatDurationsMs: [8000] },
];

describe("El tiempo transcurrido decide la escena", () => {
  it.each([
    { ms: 0, scene: 1, progress: 0, finished: false },
    { ms: 3000, scene: 1, progress: 0.5, finished: false },
    { ms: 6000, scene: 2, progress: 0, finished: false },
    { ms: 16000, scene: 3, progress: 0.5, finished: false },
    { ms: 20000, scene: 3, progress: 1, finished: true },
    { ms: 25000, scene: 3, progress: 1, finished: true },
  ])(
    "a los $ms ms toca la escena $scene con $progress de avance",
    ({ ms, scene, progress, finished }) => {
      const playhead = playheadAt(SCENES, ms);

      expect(playhead.sceneIndex + 1).toBe(scene);
      expect(playhead.sceneProgress).toBeCloseTo(progress);
      expect(playhead.finished).toBe(finished);
    },
  );

  it("un tiempo negativo se queda en el primer cuadro", () => {
    expect(playheadAt(SCENES, -500)).toMatchObject({
      sceneIndex: 0,
      beatIndex: 0,
      sceneProgress: 0,
    });
  });
});

describe("Dentro de una escena, los subtítulos se suceden solos", () => {
  const withBeats: readonly AnimationScene[] = [
    { id: "intro", pillar: null, beatDurationsMs: [1000] },
    { id: "sleep", pillar: "sleep", beatDurationsMs: [2000, 3000, 1000] },
  ];

  it.each([
    { ms: 1000, beat: 1 },
    { ms: 2999, beat: 1 },
    { ms: 3000, beat: 2 },
    { ms: 5999, beat: 2 },
    { ms: 6000, beat: 3 },
    { ms: 99999, beat: 3 },
  ])("a los $ms ms va el subtítulo $beat de la escena 2", ({ ms, beat }) => {
    const playhead = playheadAt(withBeats, ms);

    expect(playhead.sceneIndex).toBe(1);
    expect(playhead.beatIndex + 1).toBe(beat);
  });

  it("la duración total y el arranque de cada escena salen de sus subtítulos", () => {
    expect(totalDurationMs(withBeats)).toBe(7000);
    expect(sceneStartMs(withBeats, 0)).toBe(0);
    expect(sceneStartMs(withBeats, 1)).toBe(1000);
  });
});
