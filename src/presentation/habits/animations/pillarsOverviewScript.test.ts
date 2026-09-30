import { describe, expect, it } from "vitest";
import { PILLAR_KEYS } from "~/domain/pillars/pillarKey";
import en from "~/i18n/messages/en.json";
import es from "~/i18n/messages/es.json";
import {
  OVERVIEW_CAPTION_KEYS,
  PILLARS_OVERVIEW_SCRIPT,
} from "./pillarsOverviewScript";

describe("El guion de los cuatro pilares", () => {
  it("cuenta los cuatro pilares en su orden, entre un gancho y un cierre", () => {
    expect(PILLARS_OVERVIEW_SCRIPT.map((scene) => scene.pillar)).toEqual([
      null,
      ...PILLAR_KEYS,
      null,
    ]);
  });

  it("cada pilar se cuenta en tres tiempos", () => {
    const pillarScenes = PILLARS_OVERVIEW_SCRIPT.filter(
      (scene) => scene.pillar,
    );
    for (const scene of pillarScenes) {
      expect(scene.beatDurationsMs).toHaveLength(3);
    }
  });

  it.each([
    ["es", es],
    ["en", en],
  ])(
    "en %s hay un subtítulo por cada duración, y ninguno vacío",
    (_, messages) => {
      for (const scene of PILLARS_OVERVIEW_SCRIPT) {
        const keys = OVERVIEW_CAPTION_KEYS[scene.id];
        expect(keys).toHaveLength(scene.beatDurationsMs.length);
        for (const key of keys) {
          const [, sceneId, beat] = key.split(".");
          const text = (
            messages.pillarAnimations.overview as Record<
              string,
              Record<string, string>
            >
          )[sceneId]?.[beat];
          expect(text?.trim()).toBeTruthy();
        }
      }
    },
  );
});
