import { describe, expect, it } from "vitest";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import type {
  PracticeAdoption,
  PracticeSource,
} from "~/domain/practices/adoption";
import type { PracticeAdoptionRepository } from "./ports/PracticeAdoptionRepository";
import PracticeAdoptionUseCase from "./practiceAdoptionUseCase";

function repository(
  adoptions: readonly PracticeAdoption[] = [],
  practisedToday: PillarKey[] = [],
) {
  const started: Array<[string, string, PracticeSource]> = [];
  const stopped: Array<[string, string]> = [];
  const askedDates: Array<[string, string]> = [];
  const repo: PracticeAdoptionRepository & {
    started: typeof started;
    stopped: typeof stopped;
    askedDates: typeof askedDates;
    asked: string[];
  } = {
    started,
    stopped,
    askedDates,
    asked: [],
    async listFor(userId) {
      repo.asked.push(userId);
      return adoptions;
    },
    async start(userId, practiceKey, source) {
      started.push([userId, practiceKey, source]);
      return true;
    },
    async stop(userId, practiceKey) {
      stopped.push([userId, practiceKey]);
    },
    async pillarsPractisedOn(userId, cycleDate) {
      askedDates.push([userId, cycleDate]);
      return new Set(practisedToday);
    },
  };
  return repo;
}

function adoption(overrides: Partial<PracticeAdoption> = {}): PracticeAdoption {
  return {
    practiceKey: "sleep-mental-unload",
    startedAt: new Date("2026-08-10T06:00:00Z"),
    stoppedAt: null,
    sharingEnabled: false,
    source: "web",
    ...overrides,
  };
}

describe("lo que alguien practica", () => {
  it("quien no ha entrado no lleva nada, y no se le pregunta a la base", async () => {
    /* El índice es público y se lee igual sin sesión: si esto exigiera identidad, la página
       tendría que tener dos versiones. */
    const repo = repository();

    await expect(
      new PracticeAdoptionUseCase(repo).activeFor(null),
    ).resolves.toEqual(new Set());
    expect(repo.asked).toEqual([]);
  });

  it("devuelve sólo las activas, en un conjunto que se consulta 45 veces", async () => {
    const repo = repository([
      adoption(),
      adoption({
        practiceKey: "sleep-paper-book",
        stoppedAt: new Date("2026-08-20T06:00:00Z"),
      }),
    ]);

    const active = await new PracticeAdoptionUseCase(repo).activeFor("user-1");

    expect(active.has("sleep-mental-unload")).toBe(true);
    expect(active.has("sleep-paper-book")).toBe(false);
  });
});

describe("empezar y dejar", () => {
  it("por omisión el origen es la web", async () => {
    const repo = repository();

    await new PracticeAdoptionUseCase(repo).start("user-1", "mind-gratitude");

    expect(repo.started).toEqual([["user-1", "mind-gratitude", "web"]]);
  });

  it("acepta otro canal: la misma fila sirve al chat y al sitio", async () => {
    const repo = repository();

    await new PracticeAdoptionUseCase(repo).start(
      "user-1",
      "mind-gratitude",
      "telegram",
    );

    expect(repo.started).toEqual([["user-1", "mind-gratitude", "telegram"]]);
  });

  it("dejarla no la borra: se marca, y por eso pasa por `stop`", async () => {
    const repo = repository();

    await new PracticeAdoptionUseCase(repo).stop("user-1", "mind-gratitude");

    expect(repo.stopped).toEqual([["user-1", "mind-gratitude"]]);
  });
});

describe("qué pilares ya cuentan hoy", () => {
  it("sin sesión no se le pregunta a la base", async () => {
    const repo = repository();

    await expect(
      new PracticeAdoptionUseCase(repo).pillarsPractisedToday(null),
    ).resolves.toEqual(new Set());
    expect(repo.askedDates).toEqual([]);
  });

  it("devuelve pilares y no prácticas: ésa es la unidad de conteo", async () => {
    const repo = repository([], ["sleep"]);

    const pillars = await new PracticeAdoptionUseCase(
      repo,
    ).pillarsPractisedToday("user-1");

    expect([...pillars]).toEqual(["sleep"]);
  });

  it("«hoy» es la fecha local de la comunidad, no la del servidor", async () => {
    /* A las 00:30 UTC del lunes en México sigue siendo domingo. Si esto usara UTC, el botón diría
       que el día ya cuenta mientras el conteo lo pondría en la semana siguiente. */
    const repo = repository();

    await new PracticeAdoptionUseCase(repo).pillarsPractisedToday(
      "user-1",
      new Date("2026-08-24T00:30:00Z"),
    );

    expect(repo.askedDates).toEqual([["user-1", "2026-08-23"]]);
  });
});
