import { describe, expect, it } from "vitest";
import type { PracticeCard } from "~/domain/practices/practiceCard";
import type { PracticeCatalogRepository } from "./ports/PracticeCatalogRepository";
import PracticeCatalogUseCase from "./practiceCatalogUseCase";

function practice(overrides: Partial<PracticeCard> = {}): PracticeCard {
  return {
    key: "sleep-mental-unload",
    title: "La descarga mental",
    summary:
      "Escribir cinco minutos lo que queda pendiente hace dormirse antes.",
    cue: "Justo antes de lavarte los dientes para acostarte.",
    minimum: "Tres renglones bastan.",
    effortMinutes: 5,
    costLevel: 0,
    pillars: ["sleep"],
    studyCount: 1,
    challengeKey: null,
    ...overrides,
  };
}

function catalogOf(
  practices: readonly PracticeCard[],
): PracticeCatalogRepository {
  return {
    async listPublished() {
      return practices;
    },
    async findPrimaryPillar(practiceKey) {
      return (
        practices.find(({ key }) => key === practiceKey)?.pillars[0] ?? null
      );
    },
  };
}

describe("el catálogo agrupado por pilar", () => {
  it("pone cada práctica bajo el pilar del que es portada", async () => {
    const groups = await new PracticeCatalogUseCase(
      catalogOf([
        practice(),
        practice({ key: "mind-gratitude", pillars: ["mindSpirit"] }),
      ]),
    ).listByPillar("es");

    expect(groups.map(({ pillar }) => pillar)).toEqual(["sleep", "mindSpirit"]);
  });

  it("una práctica compartida aparece una sola vez, no una por pilar", async () => {
    /* Es lo que compró que `practice_pillars` sea N:N: respirar despacio sirve a Mente y a Sueño y
       está escrita una vez. Repetirla en la lista contaría como dos lo que es una. */
    const groups = await new PracticeCatalogUseCase(
      catalogOf([
        practice({
          key: "mind-slow-breathing",
          pillars: ["mindSpirit", "sleep"],
        }),
      ]),
    ).listByPillar("es");

    expect(groups).toHaveLength(1);
    expect(groups[0].pillar).toBe("mindSpirit");
    expect(groups[0].practices).toHaveLength(1);
  });

  it("respeta el orden en que la base devuelve los pilares", async () => {
    const groups = await new PracticeCatalogUseCase(
      catalogOf([
        practice({ key: "movement-take-the-stairs", pillars: ["movement"] }),
        practice({ key: "sleep-dark-room", pillars: ["sleep"] }),
        practice({ key: "movement-no-motor", pillars: ["movement"] }),
      ]),
    ).listByPillar("es");

    expect(groups.map(({ pillar }) => pillar)).toEqual(["movement", "sleep"]);
    expect(groups[0].practices).toHaveLength(2);
  });

  it("no inventa pilares vacíos", async () => {
    await expect(
      new PracticeCatalogUseCase(catalogOf([])).listByPillar("es"),
    ).resolves.toEqual([]);
  });

  it("pasa el idioma al repositorio", async () => {
    const asked: string[] = [];
    const repository: PracticeCatalogRepository = {
      async listPublished(locale) {
        asked.push(locale);
        return [];
      },
      async findPrimaryPillar() {
        return null;
      },
    };

    await new PracticeCatalogUseCase(repository).listByPillar("en");

    expect(asked).toEqual(["en"]);
  });
});

describe("el pilar del que una práctica es portada", () => {
  it("se resuelve por su clave, para que el conteo no dependa del formulario", async () => {
    const useCase = new PracticeCatalogUseCase(
      catalogOf([
        practice({
          key: "mind-slow-breathing",
          pillars: ["mindSpirit", "sleep"],
        }),
      ]),
    );

    await expect(useCase.primaryPillarOf("mind-slow-breathing")).resolves.toBe(
      "mindSpirit",
    );
  });

  it("una clave que no existe no apunta a ningún pilar", async () => {
    await expect(
      new PracticeCatalogUseCase(catalogOf([])).primaryPillarOf("inventada"),
    ).resolves.toBeNull();
  });
});
