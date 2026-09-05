import { describe, expect, it } from "vitest";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import type { StudyCitation } from "~/domain/practices/study";
import PillarBibliographyUseCase from "./pillarBibliographyUseCase";
import type { PillarBibliographyRepository } from "./ports/PillarBibliographyRepository";

function study(overrides: Partial<StudyCitation> = {}): StudyCitation {
  return {
    doi: "10.1210/jc.2010-2098",
    title:
      "Exposure to Room Light before Bedtime Suppresses Melatonin Onset and Shortens Melatonin Duration in Humans",
    journal: "The Journal of Clinical Endocrinology & Metabolism",
    year: 2011,
    design: null,
    supports: ["Atenuar la casa una hora antes"],
    ...overrides,
  };
}

function repositoryReturning(
  studies: readonly StudyCitation[],
): PillarBibliographyRepository & {
  asked: { pillar: string; locale: string }[];
} {
  const asked: { pillar: string; locale: string }[] = [];
  return {
    asked,
    async listByPillar(pillar: PillarKey, locale: string) {
      asked.push({ pillar, locale });
      return studies;
    },
  };
}

describe("PillarBibliographyUseCase", () => {
  it("pide el pilar y el idioma que le dan", async () => {
    const repository = repositoryReturning([study()]);

    await new PillarBibliographyUseCase(repository).listFor("sleep", "en");

    expect(repository.asked).toEqual([{ pillar: "sleep", locale: "en" }]);
  });

  it("una bibliografía vacía es una lista vacía, no un fallo", async () => {
    const repository = repositoryReturning([]);

    await expect(
      new PillarBibliographyUseCase(repository).listFor("nutrition", "es"),
    ).resolves.toEqual([]);
  });

  it("cuenta cuántos estudios sostienen alguna práctica", () => {
    const studies = [
      study(),
      study({ doi: "10.5664/jcsm.9476", supports: [] }),
      study({ doi: "10.1037/xge0000374", supports: ["La descarga mental"] }),
    ];

    expect(PillarBibliographyUseCase.countSupporting(studies)).toBe(2);
  });
});
