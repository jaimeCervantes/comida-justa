import { describe, expect, it } from "vitest";
import { PILLARS_OVERVIEW_SCRIPT } from "../pillarsOverviewScript";
import { totalDurationMs } from "../playhead";
import { cutRange, OUTRO_MS, SOCIAL_CUTS } from "./socialCuts";

const sceneDuration = (index: number) =>
  PILLARS_OVERVIEW_SCRIPT[index].beatDurationsMs.reduce(
    (sum, ms) => sum + ms,
    0,
  );

describe("Las piezas para redes", () => {
  it("la completa dura la animación entera, más el cierre", () => {
    const range = cutRange("completo");
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
      const range = cutRange(cut);
      expect(PILLARS_OVERVIEW_SCRIPT[index].pillar).toBe(pillar);
      expect(range.toMs - range.fromMs).toBe(sceneDuration(index));
    },
  );

  it("cada corte de pilar cabe en un video corto de redes (menos de 30 s con el cierre)", () => {
    for (const cut of Object.keys(SOCIAL_CUTS)) {
      if (cut === "completo") continue;
      expect(cutRange(cut as keyof typeof SOCIAL_CUTS).durationMs).toBeLessThan(
        30_000,
      );
    }
  });
});
