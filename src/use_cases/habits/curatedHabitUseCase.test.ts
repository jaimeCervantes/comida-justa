import { describe, expect, it } from "vitest";
import type { HabitChallengePeriod } from "~/domain/habits/atomicSleepChallenge";
import CuratedHabitUseCase from "./curatedHabitUseCase";
import type {
  CuratedHabitRepository,
  StoredCuratedHabitProgress,
} from "./ports/CuratedHabitRepository";

class FakeCuratedHabitRepository implements CuratedHabitRepository {
  private readonly progress = new Map<string, StoredCuratedHabitProgress>();

  async activate(
    userId: string,
    challengeKey: string,
    period: HabitChallengePeriod,
  ): Promise<void> {
    for (const [key, value] of this.progress) {
      this.progress.set(key, { ...value, active: false });
    }
    const current = this.progress.get(challengeKey);
    this.progress.set(challengeKey, {
      userId,
      challengeKey,
      period: current?.period ?? period,
      active: true,
      completedDates: current?.completedDates ?? [],
    });
  }

  async findProgress(
    _userId: string,
    challengeKey: string,
  ): Promise<StoredCuratedHabitProgress | null> {
    return this.progress.get(challengeKey) ?? null;
  }

  async findActive(
    _userId: string,
  ): Promise<StoredCuratedHabitProgress | null> {
    return [...this.progress.values()].find(({ active }) => active) ?? null;
  }

  async recordCycle(
    _userId: string,
    challengeKey: string,
    cycleDate: string,
    _completedAt: Date,
  ): Promise<boolean> {
    const progress = this.progress.get(challengeKey);
    if (!progress?.active || progress.completedDates.includes(cycleDate))
      return false;
    this.progress.set(challengeKey, {
      ...progress,
      completedDates: [...progress.completedDates, cycleDate],
    });
    return true;
  }
}

describe("CuratedHabitUseCase", () => {
  const clock = { now: (): Date => new Date("2026-08-11T14:00:00Z") };

  it("keeps exactly one onboarding practice active without deleting prior progress", async () => {
    const repository = new FakeCuratedHabitRepository();
    const useCase = new CuratedHabitUseCase(repository, clock);
    await useCase.activate(
      "user-1",
      "nutrition-one-plant-v1",
      "America/Mexico_City",
    );
    await useCase.completeToday("user-1", "nutrition-one-plant-v1");
    await useCase.activate(
      "user-1",
      "movement-two-minutes-v1",
      "America/Mexico_City",
    );

    expect(await useCase.getActive("user-1")).toMatchObject({
      challengeKey: "movement-two-minutes-v1",
    });
    expect(
      await useCase.getProgress("user-1", "nutrition-one-plant-v1"),
    ).toMatchObject({
      active: false,
      completedCycles: 1,
      xp: 10,
    });
  });

  it("caps a generic practice at one repetition per local day", async () => {
    const repository = new FakeCuratedHabitRepository();
    const useCase = new CuratedHabitUseCase(repository, clock);
    await useCase.activate(
      "user-1",
      "nutrition-one-plant-v1",
      "America/Mexico_City",
    );

    expect(
      await useCase.completeToday("user-1", "nutrition-one-plant-v1"),
    ).toBe(true);
    expect(
      await useCase.completeToday("user-1", "nutrition-one-plant-v1"),
    ).toBe(false);
    expect(
      await useCase.getProgress("user-1", "nutrition-one-plant-v1"),
    ).toMatchObject({
      completedCycles: 1,
      xp: 10,
    });
  });
});
