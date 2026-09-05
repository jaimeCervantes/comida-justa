import { describe, expect, it } from "vitest";
import type {
  PracticeAdoption,
  PracticeSource,
} from "~/domain/practices/adoption";
import type { PracticeAdoptionRepository } from "./ports/PracticeAdoptionRepository";
import PracticeAdoptionUseCase from "./practiceAdoptionUseCase";

function repository(adoptions: readonly PracticeAdoption[] = []) {
  const started: Array<[string, string, PracticeSource]> = [];
  const stopped: Array<[string, string]> = [];
  const repo: PracticeAdoptionRepository & {
    started: typeof started;
    stopped: typeof stopped;
    asked: string[];
  } = {
    started,
    stopped,
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
