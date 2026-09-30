import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PILLARS } from "~/app/[locale]/pilares/components/pilaresData";
import en from "~/i18n/messages/en.json";
import es from "~/i18n/messages/es.json";
import { PILLAR_SLUGS_WITH_ANIMATION } from "../inviteRoutes";
import { totalDurationMs } from "../playhead";
import { artFiles } from "../scenes/artSources";
import { PILLAR_STORIES } from "./pillarStories";
import { type PillarStory, storyArts } from "./pillarStory";

const STORIES = Object.values(PILLAR_STORIES) as PillarStory[];

/** Un texto del catálogo por su clave con puntos (`sleep.cost.b2`). */
function messageAt(messages: typeof es, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      messages.pillarAnimations,
    );
}

describe.each(STORIES.map((story) => [story.animationId, story] as const))(
  "La animación %s",
  (_, story) => {
    it("se cuenta en los cinco tiempos, en su orden", () => {
      expect(story.script.map((scene) => scene.id)).toEqual([
        "before",
        "change",
        "cost",
        "counterweight",
        "practice",
      ]);
      expect(story.script.every((scene) => scene.pillar === story.pillar)).toBe(
        true,
      );
    });

    it("dura dos minutos como mucho: quien la ve ya eligió el pilar, pero no más", () => {
      expect(totalDurationMs(story.script)).toBeLessThanOrEqual(120_000);
    });

    it("cada duración va en cuartos de segundo, como las mide la narración", () => {
      for (const scene of story.script) {
        for (const ms of scene.beatDurationsMs) expect(ms % 250).toBe(0);
      }
    });

    it("tiene una ilustración y un subtítulo por cada duración", () => {
      for (const scene of story.script) {
        expect(story.scenes[scene.id].beats).toHaveLength(
          scene.beatDurationsMs.length,
        );
        expect(story.captionKeys[scene.id]).toHaveLength(
          scene.beatDurationsMs.length,
        );
      }
    });

    it.each([
      ["es", es],
      ["en", en],
    ] as const)(
      "en %s cada subtítulo existe y marca su frase clave",
      (_, messages) => {
        for (const scene of story.script) {
          for (const key of story.captionKeys[scene.id]) {
            expect(String(messageAt(messages, key))).toContain("<hl>");
          }
          expect(
            String(messageAt(messages, story.chipKeys[scene.id])),
          ).not.toBe("");
        }
      },
    );

    it("ninguna ilustración se repite, y todas están publicadas en sus tres anchos", () => {
      const arts = storyArts(story);
      expect(new Set(arts).size).toBe(arts.length);
      for (const art of arts) {
        for (const file of artFiles(art)) {
          expect(fs.existsSync(path.join(process.cwd(), "public", file))).toBe(
            true,
          );
        }
      }
    });

    it("el logo solo cierra: al abrir ya está en la cabecera", () => {
      expect(
        story.script.map((scene) => story.scenes[scene.id].logo ?? null),
      ).toEqual([null, null, null, null, "closing"]);
    });

    it("los efectos se anclan dentro de la ilustración", () => {
      const inside = (value: number) => value >= 0 && value <= 100;
      for (const scene of story.script) {
        for (const beat of story.scenes[scene.id].beats) {
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

    it("vive en la página de su pilar y trae su pista de sonido en los dos idiomas", () => {
      expect(PILLARS.find((pillar) => pillar.key === story.pillar)?.slug).toBe(
        story.slug,
      );
      for (const locale of ["es", "en"]) {
        const file = path.join(
          process.cwd(),
          "public",
          `${story.soundtrackBase}-${locale}.mp3`,
        );
        expect(fs.existsSync(file)).toBe(true);
      }
    });
  },
);

describe("Las páginas con animación propia", () => {
  it("son las que no reciben la invitación a ver los cuatro pilares", () => {
    expect([...PILLAR_SLUGS_WITH_ANIMATION].sort()).toEqual(
      STORIES.map((story) => story.slug).sort(),
    );
  });
});
