import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { OVERVIEW_ARTS, OVERVIEW_SCENES } from "./overviewScenes";
import {
  OVERVIEW_CAPTION_KEYS,
  PILLARS_OVERVIEW_SCRIPT,
} from "./pillarsOverviewScript";
import { artFiles } from "./scenes/artSources";

describe("Las ilustraciones de la animación de los cuatro pilares", () => {
  it("hay una ilustración por cada subtítulo del guion", () => {
    for (const scene of PILLARS_OVERVIEW_SCRIPT) {
      expect(OVERVIEW_SCENES[scene.id].beats).toHaveLength(
        OVERVIEW_CAPTION_KEYS[scene.id].length,
      );
    }
  });

  it("ninguna ilustración se repite", () => {
    expect(new Set(OVERVIEW_ARTS).size).toBe(OVERVIEW_ARTS.length);
  });

  it.each(OVERVIEW_ARTS)("«%s» está publicada en sus tres anchos", (art) => {
    for (const file of artFiles(art)) {
      expect(fs.existsSync(path.join(process.cwd(), "public", file))).toBe(
        true,
      );
    }
  });

  it("el logo solo cierra: al abrir ya está en la cabecera, y los pilares son los protagonistas de su escena", () => {
    const withLogo = PILLARS_OVERVIEW_SCRIPT.filter(
      (scene) => OVERVIEW_SCENES[scene.id].logo,
    ).map((scene) => [scene.id, OVERVIEW_SCENES[scene.id].logo]);

    expect(withLogo).toEqual([["closing", "closing"]]);
  });

  it("los efectos se anclan dentro de la ilustración", () => {
    const inside = (value: number) => value >= 0 && value <= 100;
    for (const scene of Object.values(OVERVIEW_SCENES)) {
      for (const beat of scene.beats) {
        for (const effect of beat.atmosphere ?? []) {
          const point =
            "at" in effect
              ? effect.at
              : "from" in effect
                ? effect.from
                : effect.area;
          expect(inside(point.x) && inside(point.y)).toBe(true);
        }
      }
    }
  });
});
