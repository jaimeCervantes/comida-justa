import { describe, expect, it } from "vitest";
import AtomicSleepChallengeUseCase from "./atomicSleepChallengeUseCase";
import type {
  AtomicSleepChallengeRepository,
  HabitCelebrationMilestone,
  HabitChallengeSchedule,
  StoredAtomicSleepProgress,
} from "./ports/AtomicSleepChallengeRepository";

const USER_ID = "pw-healthy-food";

class FakeAtomicSleepChallengeRepository
  implements AtomicSleepChallengeRepository
{
  private progress: StoredAtomicSleepProgress | null = null;
  completeWrites = 0;

  async start(userId: string, schedule: HabitChallengeSchedule): Promise<void> {
    if (this.progress) return;
    this.progress = {
      userId,
      challengeKey: "sleep-evening-to-morning-v1",
      startedAt: new Date("2026-08-06T12:00:00Z"),
      ...schedule,
      firstCycleCompletedAt: null,
      finalCompletedAt: null,
      completedDates: [],
      celebrationStatus: "absent",
      finalCelebrationStatus: "absent",
      gardenSharingEnabled: false,
    };
  }

  async findProgress(
    userId: string,
  ): Promise<StoredAtomicSleepProgress | null> {
    return this.progress?.userId === userId ? this.progress : null;
  }

  async recordCycle(
    userId: string,
    cycleDate: string,
    completedAt: Date,
  ): Promise<boolean> {
    if (!this.progress || this.progress.userId !== userId) return false;
    if (this.progress.completedDates.includes(cycleDate)) return false;

    this.completeWrites += 1;
    const completedDates = [...this.progress.completedDates, cycleDate].sort();
    this.progress = {
      ...this.progress,
      completedDates,
      firstCycleCompletedAt: this.progress.firstCycleCompletedAt ?? completedAt,
      finalCompletedAt:
        completedDates.length >= 5
          ? (this.progress.finalCompletedAt ?? completedAt)
          : null,
    };
    return true;
  }

  async publishCelebration(
    _userId: string,
    milestone: HabitCelebrationMilestone,
  ): Promise<boolean> {
    const completedAt =
      milestone === "first_cycle"
        ? this.progress?.firstCycleCompletedAt
        : this.progress?.finalCompletedAt;
    if (!this.progress || !completedAt) return false;
    this.progress = {
      ...this.progress,
      ...(milestone === "first_cycle"
        ? { celebrationStatus: "active" as const }
        : { finalCelebrationStatus: "active" as const }),
    };
    return true;
  }

  async withdrawCelebration(
    userId: string,
    milestone: HabitCelebrationMilestone,
  ): Promise<void> {
    if (this.progress?.userId !== userId) return;
    this.progress = {
      ...this.progress,
      ...(milestone === "first_cycle"
        ? { celebrationStatus: "withdrawn" as const }
        : { finalCelebrationStatus: "withdrawn" as const }),
    };
  }

  async setGardenSharing(userId: string, enabled: boolean): Promise<void> {
    if (this.progress?.userId !== userId) return;
    this.progress = { ...this.progress, gardenSharingEnabled: enabled };
  }
}

const clock = { now: (): Date => new Date("2026-08-10T14:00:00Z") };

describe("AtomicSleepChallengeUseCase", () => {
  it("starts once and exposes a private seed", async () => {
    const repository = new FakeAtomicSleepChallengeRepository();
    const useCase = new AtomicSleepChallengeUseCase(repository, clock);

    expect(await useCase.start(USER_ID, "America/Mexico_City")).toMatchObject({
      level: "seed",
      xp: 0,
      badge: null,
      celebrationStatus: "absent",
      completedCycles: 0,
    });
    expect(await useCase.start(USER_ID, "America/Mexico_City")).toMatchObject({
      level: "seed",
      xp: 0,
      badge: null,
      celebrationStatus: "absent",
    });
  });

  it("rejects an incomplete minimum without writing progress", async () => {
    const repository = new FakeAtomicSleepChallengeRepository();
    const useCase = new AtomicSleepChallengeUseCase(repository, clock);
    await useCase.start(USER_ID, "America/Mexico_City");

    expect(
      await useCase.completeCheckIn(USER_ID, {
        cueCompleted: true,
        minimumCompleted: false,
        cycleDate: "2026-08-10",
      }),
    ).toEqual({ ok: false, reason: "incomplete" });
    expect(repository.completeWrites).toBe(0);
  });

  it("awards the first cycle once even when the intent is sent twice", async () => {
    const repository = new FakeAtomicSleepChallengeRepository();
    const useCase = new AtomicSleepChallengeUseCase(repository, clock);
    await useCase.start(USER_ID, "America/Mexico_City");

    const input = {
      cueCompleted: true,
      minimumCompleted: true,
      cycleDate: "2026-08-10",
    };
    expect(await useCase.completeCheckIn(USER_ID, input)).toMatchObject({
      ok: true,
      newlyCompleted: true,
      recognition: "first",
      progress: { level: "sprout", xp: 10, badge: "first-step" },
    });
    expect(await useCase.completeCheckIn(USER_ID, input)).toMatchObject({
      ok: true,
      newlyCompleted: false,
      progress: { level: "sprout", xp: 10, badge: "first-step" },
    });
    expect(repository.completeWrites).toBe(1);
  });

  it("does not publish before completion and can withdraw without losing progress", async () => {
    const repository = new FakeAtomicSleepChallengeRepository();
    const useCase = new AtomicSleepChallengeUseCase(repository, clock);
    await useCase.start(USER_ID, "America/Mexico_City");

    expect(await useCase.shareCelebration(USER_ID, "first_cycle")).toBe(false);

    await useCase.completeCheckIn(USER_ID, {
      cueCompleted: true,
      minimumCompleted: true,
      cycleDate: "2026-08-10",
    });
    expect(await useCase.shareCelebration(USER_ID, "first_cycle")).toBe(true);
    expect(await useCase.getProgress(USER_ID)).toMatchObject({
      level: "sprout",
      xp: 10,
      celebrationStatus: "active",
    });

    await useCase.withdrawCelebration(USER_ID, "first_cycle");
    expect(await useCase.getProgress(USER_ID)).toMatchObject({
      level: "sprout",
      xp: 10,
      badge: "first-step",
      celebrationStatus: "withdrawn",
      completedCycles: 1,
    });
  });

  it("recognizes a comeback and completes the challenge at five distinct dates", async () => {
    const repository = new FakeAtomicSleepChallengeRepository();
    let now = new Date("2026-08-06T14:00:00Z");
    const useCase = new AtomicSleepChallengeUseCase(repository, {
      now: (): Date => now,
    });
    await useCase.start(USER_ID, "America/Mexico_City");
    now = new Date("2026-08-10T14:00:00Z");

    for (const cycleDate of [
      "2026-08-06",
      "2026-08-07",
      "2026-08-09",
      "2026-08-08",
      "2026-08-10",
    ]) {
      const result = await useCase.completeCheckIn(USER_ID, {
        cueCompleted: true,
        minimumCompleted: true,
        cycleDate,
      });
      if (cycleDate === "2026-08-09") {
        expect(result).toMatchObject({ recognition: "comeback" });
      }
    }

    expect(await useCase.getProgress(USER_ID)).toMatchObject({
      completedCycles: 5,
      xp: 50,
      level: "harvest",
      badge: "sleep-harvest",
      succeeded: true,
    });
    expect(await useCase.shareCelebration(USER_ID, "challenge_completed")).toBe(
      true,
    );
    await useCase.withdrawCelebration(USER_ID, "challenge_completed");
    expect(await useCase.getProgress(USER_ID)).toMatchObject({
      finalCelebrationStatus: "withdrawn",
      xp: 50,
      badge: "sleep-harvest",
    });
  });
});
