import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type { AtomicSleepProgress } from "~/use_cases/habits/atomicSleepChallengeUseCase";
import HabitChallengePanel from "./HabitChallengePanel";

const action = vi.fn(async (state) => state);

describe("HabitChallengePanel", () => {
  const progress: AtomicSleepProgress = {
    level: "seed",
    xp: 0,
    badge: null,
    celebrationStatus: "absent",
    finalCelebrationStatus: "absent",
    gardenSharingEnabled: false,
    completedCycles: 0,
    targetCycles: 5,
    totalDays: 7,
    completedDates: [],
    period: {
      startDate: "2026-08-06",
      endDate: "2026-08-13",
      timezone: "America/Mexico_City",
    },
    succeeded: false,
  };

  it("requires the nutrition cue and minimum but not advance preparation", () => {
    renderWithIntl(
      <HabitChallengePanel
        action={action}
        challenge="nutrition"
        initialProgress={progress}
        signedIn
        signInHref="/auth/signin"
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: "Elegí mi comida ancla" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Sumé una planta" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.queryByText(/lavad[oa]/i)).not.toBeInTheDocument();
  });

  it("renders Nutrition's own final milestone", () => {
    renderWithIntl(
      <HabitChallengePanel
        action={action}
        challenge="nutrition"
        initialProgress={{
          ...progress,
          level: "harvest",
          xp: 50,
          completedCycles: 5,
          completedDates: [
            "2026-08-06",
            "2026-08-07",
            "2026-08-08",
            "2026-08-09",
            "2026-08-10",
          ],
          succeeded: true,
        }}
        signedIn
        signInHref="/auth/signin"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Cultivaste cinco elecciones reales",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("5 de 7 elecciones")).toBeInTheDocument();
  });

  it("scores Movement's cue and two-minute minimum without scoring continuation", () => {
    renderWithIntl(
      <HabitChallengePanel
        action={action}
        challenge="movement"
        initialProgress={progress}
        signedIn
        signInHref="/auth/signin"
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: "Usé mi señal para empezar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: "Me moví dos minutos según mi capacidad",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.queryByRole("checkbox", { name: /continué/i })).toBeNull();
  });

  it("never asks Mind and Community to score the recipient's response", () => {
    renderWithIntl(
      <HabitChallengePanel
        action={action}
        challenge="mind"
        initialProgress={progress}
        signedIn
        signInHref="/auth/signin"
      />,
    );

    expect(
      screen.getByRole("checkbox", {
        name: "Hice una pausa lejos del ruido digital",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: "Envié un mensaje genuino y dejé espacio para escuchar",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.queryByRole("checkbox", { name: /respondió/i })).toBeNull();
  });
});
