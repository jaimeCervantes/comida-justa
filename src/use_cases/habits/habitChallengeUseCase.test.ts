import { describe, expect, it } from "vitest";
import HabitChallengeUseCase from "./habitChallengeUseCase";
import type {
  HabitCelebrationMilestone,
  HabitChallengeRepository,
  HabitChallengeSchedule,
  StoredHabitChallengeProgress,
} from "./ports/HabitChallengeRepository";

const USER_ID = "pw-healthy-food";

class FakeHabitChallengeRepository implements HabitChallengeRepository {
  private progress: StoredHabitChallengeProgress | null = null;
  completeWrites = 0;

  /**
   * Guarda la ventana que le dan, exista o no la fila. Ignoraba la segunda llamada, que era
   * justamente el `coalesce` del repositorio real: un doble que congela la ventana no puede
   * descubrir que la ventana no se renovaba.
   */
  async start(userId: string, schedule: HabitChallengeSchedule): Promise<void> {
    this.progress = {
      userId,
      challengeKey: "sleep-evening-to-morning-v1",
      startedAt: new Date("2026-08-06T12:00:00Z"),
      firstCycleCompletedAt: null,
      finalCompletedAt: null,
      completedDates: [],
      celebrationStatus: "absent",
      finalCelebrationStatus: "absent",
      gardenSharingEnabled: false,
      ...this.progress,
      ...schedule,
    };
  }

  async findProgress(
    userId: string,
  ): Promise<StoredHabitChallengeProgress | null> {
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

  /** La columna es de texto y la base la comparte otro backend: puede llegar cualquier cosa. */
  corruptTimezone(timezone: string): void {
    if (this.progress) this.progress = { ...this.progress, timezone };
  }
}

const clock = { now: (): Date => new Date("2026-08-10T14:00:00Z") };

/** Un reloj que se puede mover entre una semana y la siguiente. */
class MovableClock {
  constructor(private instant: Date) {}
  now = (): Date => this.instant;
  moveTo(instant: string): void {
    this.instant = new Date(instant);
  }
}

describe("HabitChallengeUseCase", () => {
  describe("the week that comes back", () => {
    it("opens the current week when the stored one already closed", async () => {
      const repository = new FakeHabitChallengeRepository();
      const movable = new MovableClock(new Date("2026-08-11T18:00:00Z"));
      const useCase = new HabitChallengeUseCase(repository, movable);
      await useCase.start(USER_ID, "America/Mexico_City");
      await useCase.completeCheckIn(USER_ID, {
        cueCompleted: true,
        minimumCompleted: true,
        cycleDate: "2026-08-11",
      });

      movable.moveTo("2026-08-23T18:00:00Z");
      expect(await useCase.getProgress(USER_ID)).toMatchObject({
        periodClosed: true,
      });

      expect(await useCase.start(USER_ID, "America/Mexico_City")).toMatchObject(
        {
          period: {
            startDate: "2026-08-23",
            endDate: "2026-08-24",
            timezone: "America/Mexico_City",
          },
          periodClosed: false,
          completedCycles: 0,
          targetCycles: 1,
          totalDays: 1,
          succeeded: false,
        },
      );
    });

    it("keeps the points and the level earned in the weeks before", async () => {
      const repository = new FakeHabitChallengeRepository();
      const movable = new MovableClock(new Date("2026-08-17T18:00:00Z"));
      const useCase = new HabitChallengeUseCase(repository, movable);
      await useCase.start(USER_ID, "America/Mexico_City");
      movable.moveTo("2026-08-19T18:00:00Z");
      for (const cycleDate of ["2026-08-17", "2026-08-18", "2026-08-19"]) {
        await useCase.completeCheckIn(USER_ID, {
          cueCompleted: true,
          minimumCompleted: true,
          cycleDate,
        });
      }

      movable.moveTo("2026-08-24T18:00:00Z");
      await useCase.start(USER_ID, "America/Mexico_City");

      expect(await useCase.getProgress(USER_ID)).toMatchObject({
        completedCycles: 0,
        completedDates: [],
        xp: 30,
        level: "root",
        badge: "first-step",
      });
    });

    it("adds the week to the sustained count instead of restarting it", async () => {
      const repository = new FakeHabitChallengeRepository();
      const movable = new MovableClock(new Date("2026-08-17T18:00:00Z"));
      const useCase = new HabitChallengeUseCase(repository, movable);
      await useCase.start(USER_ID, "America/Mexico_City");
      await useCase.completeCheckIn(USER_ID, {
        cueCompleted: true,
        minimumCompleted: true,
        cycleDate: "2026-08-17",
      });
      expect(await useCase.getProgress(USER_ID)).toMatchObject({
        sustainedWeeks: 1,
      });

      movable.moveTo("2026-08-24T18:00:00Z");
      await useCase.start(USER_ID, "America/Mexico_City");
      await useCase.completeCheckIn(USER_ID, {
        cueCompleted: true,
        minimumCompleted: true,
        cycleDate: "2026-08-24",
      });

      expect(await useCase.getProgress(USER_ID)).toMatchObject({
        completedCycles: 1,
        sustainedWeeks: 2,
      });
    });

    it("refuses a date from the week that closed", async () => {
      const repository = new FakeHabitChallengeRepository();
      const movable = new MovableClock(new Date("2026-08-17T18:00:00Z"));
      const useCase = new HabitChallengeUseCase(repository, movable);
      await useCase.start(USER_ID, "America/Mexico_City");

      movable.moveTo("2026-08-24T18:00:00Z");
      await useCase.start(USER_ID, "America/Mexico_City");

      expect(
        await useCase.completeCheckIn(USER_ID, {
          cueCompleted: true,
          minimumCompleted: true,
          cycleDate: "2026-08-19",
        }),
      ).toEqual({ ok: false, reason: "outside-period" });
    });

    it("reads a progress whose stored timezone is unusable instead of failing the page", async () => {
      const repository = new FakeHabitChallengeRepository();
      const movable = new MovableClock(new Date("2026-08-17T18:00:00Z"));
      const useCase = new HabitChallengeUseCase(repository, movable);
      await useCase.start(USER_ID, "America/Mexico_City");
      repository.corruptTimezone("Marte/Olympus_Mons");

      movable.moveTo("2026-08-24T18:00:00Z");

      await expect(useCase.getProgress(USER_ID)).resolves.toMatchObject({
        periodClosed: true,
      });
    });

    it("does not reopen a week still running, so a bad day cannot be erased", async () => {
      const repository = new FakeHabitChallengeRepository();
      const movable = new MovableClock(new Date("2026-08-17T18:00:00Z"));
      const useCase = new HabitChallengeUseCase(repository, movable);
      await useCase.start(USER_ID, "America/Mexico_City");
      await useCase.completeCheckIn(USER_ID, {
        cueCompleted: true,
        minimumCompleted: true,
        cycleDate: "2026-08-17",
      });

      movable.moveTo("2026-08-20T18:00:00Z");

      expect(await useCase.start(USER_ID, "America/Mexico_City")).toMatchObject(
        {
          period: {
            startDate: "2026-08-17",
            endDate: "2026-08-24",
            timezone: "America/Mexico_City",
          },
          completedCycles: 1,
          targetCycles: 5,
          totalDays: 7,
        },
      );
    });
  });

  it("starts once and exposes a private seed", async () => {
    const repository = new FakeHabitChallengeRepository();
    const useCase = new HabitChallengeUseCase(repository, clock);

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
    const repository = new FakeHabitChallengeRepository();
    const useCase = new HabitChallengeUseCase(repository, clock);
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
    const repository = new FakeHabitChallengeRepository();
    const useCase = new HabitChallengeUseCase(repository, clock);
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
    const repository = new FakeHabitChallengeRepository();
    const useCase = new HabitChallengeUseCase(repository, clock);
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
    const repository = new FakeHabitChallengeRepository();
    // Un lunes: la ventana cierra en el lunes de la comunidad, así que solo quien se suma en lunes
    // tiene los siete días por delante que esta meta de cinco supone.
    let now = new Date("2026-08-10T14:00:00Z");
    const useCase = new HabitChallengeUseCase(repository, {
      now: (): Date => now,
    });
    await useCase.start(USER_ID, "America/Mexico_City");
    now = new Date("2026-08-14T14:00:00Z");

    for (const cycleDate of [
      "2026-08-10",
      "2026-08-11",
      "2026-08-13",
      "2026-08-12",
      "2026-08-14",
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
      badge: "harvest",
      succeeded: true,
    });
    expect(await useCase.shareCelebration(USER_ID, "challenge_completed")).toBe(
      true,
    );
    await useCase.withdrawCelebration(USER_ID, "challenge_completed");
    expect(await useCase.getProgress(USER_ID)).toMatchObject({
      finalCelebrationStatus: "withdrawn",
      xp: 50,
      badge: "harvest",
    });
  });
});
