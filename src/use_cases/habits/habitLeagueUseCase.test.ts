import { describe, expect, it } from "vitest";
import type { LeagueParticipantActivity } from "~/domain/habits/habitLeague";
import HabitLeagueUseCase from "./habitLeagueUseCase";
import type { HabitLeagueRepository } from "./ports/HabitLeagueRepository";

/** Diez personas: justo el umbral, para poder mirar lo que hay por encima y por debajo. */
function crowd(size: number): LeagueParticipantActivity[] {
  return Array.from({ length: size }, (_, index) => ({
    alias: `alias-${String(index).padStart(2, "0")}`,
    weeklyRepetitions: index,
    practiceDates: ["2026-08-10"],
  }));
}

function repositoryWith(
  participants: LeagueParticipantActivity[],
  viewer = { alias: null as string | null, optedIn: false },
): HabitLeagueRepository & { optIns: Array<[string, boolean]> } {
  const optIns: Array<[string, boolean]> = [];
  return {
    optIns,
    async readWeeklyParticipants() {
      return participants;
    },
    async readViewer() {
      return viewer;
    },
    async setOptIn(userId, enabled) {
      optIns.push([userId, enabled]);
    },
  };
}

describe("la tabla del jardín", () => {
  it("no se pinta por debajo del umbral, y dice cuánto falta", async () => {
    const state = await new HabitLeagueUseCase(
      repositoryWith(crowd(9)),
    ).getState(null);

    expect(state.eligible).toBe(false);
    expect(state.contributors).toEqual([]);
    expect(state.activeOptIns).toBe(9);
    expect(state.threshold).toBe(10);
  });

  it("aparece al llegar al umbral, ordenada por aporte", async () => {
    const state = await new HabitLeagueUseCase(
      repositoryWith(crowd(10)),
    ).getState(null);

    expect(state.eligible).toBe(true);
    expect(state.contributors).toHaveLength(10);
    expect(state.contributors[0].contributions).toBe(9);
    expect(state.contributors.at(-1)?.contributions).toBe(0);
  });

  it("nunca devuelve un puesto: el orden es toda la posición que hay", async () => {
    const state = await new HabitLeagueUseCase(
      repositoryWith(crowd(10)),
    ).getState(null);

    for (const entry of state.contributors) {
      expect(entry).not.toHaveProperty("rank");
    }
  });
});

describe("aparecer en la tabla", () => {
  it("exige alias: aparecer con nombre es una decisión, no un efecto de practicar", async () => {
    const repository = repositoryWith([], { alias: null, optedIn: false });

    await expect(
      new HabitLeagueUseCase(repository).setOptIn("user-1", true),
    ).resolves.toBe(false);
    expect(repository.optIns).toEqual([]);
  });

  it("con alias, se registra", async () => {
    const repository = repositoryWith([], { alias: "ana", optedIn: false });

    await expect(
      new HabitLeagueUseCase(repository).setOptIn("user-1", true),
    ).resolves.toBe(true);
    expect(repository.optIns).toEqual([["user-1", true]]);
  });

  it("salirse no exige alias: retirar el consentimiento nunca se bloquea", async () => {
    const repository = repositoryWith([], { alias: null, optedIn: true });

    await expect(
      new HabitLeagueUseCase(repository).setOptIn("user-1", false),
    ).resolves.toBe(true);
    expect(repository.optIns).toEqual([["user-1", false]]);
  });
});
