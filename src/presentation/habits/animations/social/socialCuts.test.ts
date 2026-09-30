import { describe, expect, it } from "vitest";
import {
  OVERVIEW_CAPTION_KEYS,
  PILLARS_OVERVIEW_SCRIPT,
} from "../pillarsOverviewScript";
import { sceneStartMs, totalDurationMs } from "../playhead";
import { FILMS } from "./films";
import { cutBeats, cutRange, OUTRO_MS } from "./socialCuts";

const OVERVIEW = FILMS.pilares;

const sceneDuration = (index: number) =>
  PILLARS_OVERVIEW_SCRIPT[index].beatDurationsMs.reduce(
    (sum, ms) => sum + ms,
    0,
  );

describe("Las piezas para redes", () => {
  it("la completa dura la animación entera, más el cierre", () => {
    const range = cutRange(OVERVIEW, "completo");
    expect(range.fromMs).toBe(0);
    expect(range.toMs).toBe(totalDurationMs(PILLARS_OVERVIEW_SCRIPT));
    expect(range.durationMs).toBe(range.toMs + OUTRO_MS);
  });

  it.each([
    ["sueno", 1, "sleep"],
    ["alimentacion", 2, "nutrition"],
    ["movimiento", 3, "movement"],
    ["mente", 4, "mindSpirit"],
  ] as const)(
    "el corte «%s» es exactamente la escena de su pilar",
    (cut, index, pillar) => {
      const range = cutRange(OVERVIEW, cut);
      expect(PILLARS_OVERVIEW_SCRIPT[index].pillar).toBe(pillar);
      expect(range.toMs - range.fromMs).toBe(sceneDuration(index));
    },
  );

  it("cada corte de pilar cabe en un video corto de redes (menos de 45 s con el cierre)", () => {
    for (const cut of Object.keys(OVERVIEW.cuts)) {
      if (cut === "completo") continue;
      expect(cutRange(OVERVIEW, cut).durationMs).toBeLessThan(45_000);
    }
  });
});

describe("Dónde entra la narración de cada subtítulo", () => {
  it("en el corte de Sueño, el primero entra al empezar y cada uno cuando acaba el anterior", () => {
    const [first, second] = PILLARS_OVERVIEW_SCRIPT[1].beatDurationsMs;

    expect(cutBeats(OVERVIEW, cutRange(OVERVIEW, "sueno"))).toEqual([
      { key: "sleep.b1", startMs: 0 },
      { key: "sleep.b2", startMs: first },
      { key: "sleep.b3", startMs: first + second },
    ]);
  });

  it("en la pieza completa, cada escena empieza con su primer subtítulo", () => {
    const beats = cutBeats(OVERVIEW, cutRange(OVERVIEW, "completo"));

    PILLARS_OVERVIEW_SCRIPT.forEach((scene, index) => {
      expect(beats).toContainEqual({
        key: `${scene.id}.b1`,
        startMs: sceneStartMs(PILLARS_OVERVIEW_SCRIPT, index),
      });
    });
  });

  it("cada subtítulo se llama como su texto en el catálogo, que es el nombre de su narración", () => {
    const keys = cutBeats(OVERVIEW, cutRange(OVERVIEW, "completo")).map(
      ({ key }) => `overview.${key}`,
    );

    expect(keys).toEqual(Object.values(OVERVIEW_CAPTION_KEYS).flat());
  });
});
