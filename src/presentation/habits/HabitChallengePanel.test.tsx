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

  it("shows saved progress even when the old onboarding flag is inactive", () => {
    const historicalProgress = {
      ...progress,
      active: false,
      level: "sprout" as const,
      xp: 10,
      completedCycles: 1,
      completedDates: ["2026-08-06"],
    };
    renderWithIntl(
      <HabitChallengePanel
        action={action}
        challenge="nutrition"
        initialProgress={historicalProgress}
        signedIn
        signInHref="/auth/signin"
      />,
    );

    expect(screen.getByText("1 de 7 elecciones")).toBeInTheDocument();
    expect(screen.getAllByText("10 puntos").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", {
        name: "Continuar mi semana de elecciones reales",
      }),
    ).not.toBeInTheDocument();
  });

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

  it.each([
    ["es", 0, "0 puntos"],
    ["es", 1, "10 puntos"],
    ["es", 5, "50 puntos"],
    ["en", 0, "0 points"],
    ["en", 1, "10 points"],
    ["en", 5, "50 points"],
  ] as const)(
    "shows everyday progress wording for $locale with $completedCycles cycles",
    (locale, completedCycles, label) => {
      renderWithIntl(
        <HabitChallengePanel
          action={action}
          challenge="nutrition"
          initialProgress={{
            ...progress,
            level:
              completedCycles === 5
                ? "harvest"
                : completedCycles === 1
                  ? "sprout"
                  : "seed",
            xp: completedCycles * 10,
            completedCycles,
            completedDates: Array.from(
              { length: completedCycles },
              (_, index) => `2026-08-${String(index + 6).padStart(2, "0")}`,
            ),
            succeeded: completedCycles === 5,
          }}
          signedIn
          signInHref="/auth/signin"
        />,
        { locale },
      );

      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
      expect(document.body).not.toHaveTextContent(/\b(?:XP|EXP)\b/);
    },
  );
});
