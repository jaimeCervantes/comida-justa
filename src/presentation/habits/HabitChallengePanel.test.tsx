import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type { HabitChallengeProgress } from "~/use_cases/habits/habitChallengeUseCase";
import HabitChallengePanel from "./HabitChallengePanel";

const action = vi.fn(async (state) => state);

describe("HabitChallengePanel", () => {
  const progress: HabitChallengeProgress = {
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

    expect(screen.getByText("1 de 7 cenas")).toBeInTheDocument();
    expect(screen.getAllByText("10 puntos").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", {
        name: "Continuar mi semana de cenas reales",
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
      screen.getByRole("checkbox", { name: "Cené al atardecer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: "Serví la triada con una planta más",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.queryByText(/a granel/i)).not.toBeInTheDocument();
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
        name: "Cultivaste cinco cenas reales",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("5 de 7 cenas")).toBeInTheDocument();
  });

  it("scores Movement's engine-free trip and two-minute minimum, never the extra time", () => {
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
      screen.getByRole("checkbox", { name: "Me moví sin motor" }),
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

  /**
   * Sueño llegó a este panel desde su propio envoltorio, y sus pruebas vivían con él. El envoltorio
   * ya no existe —la práctica pasa la acción directamente— así que sus casos se quedan aquí: son
   * los del panel, no los de una página.
   */
  describe("with the sleep ritual", () => {
    it("starts with one clear action before progress exists", () => {
      renderWithIntl(
        <HabitChallengePanel
          action={action}
          challenge="sleep"
          initialProgress={null}
          signedIn
          signInHref="/auth/signin?callbackUrl=%2Fpilares%2Fsueno"
        />,
      );

      expect(
        screen.getByRole("button", {
          name: "Empezar Del atardecer al amanecer",
        }),
      ).toBeInTheDocument();
    });

    it("asks for both minimum anchors while the attempt is a seed", () => {
      renderWithIntl(
        <HabitChallengePanel
          action={action}
          challenge="sleep"
          initialProgress={progress}
          signedIn
          signInHref="/auth/signin"
        />,
      );

      expect(screen.getAllByRole("checkbox")).toHaveLength(2);
      expect(
        screen.getByRole("button", { name: "Completar mi primer ciclo" }),
      ).toBeInTheDocument();
    });

    it("shows the immediate reward and private sharing choice for a sprout", () => {
      renderWithIntl(
        <HabitChallengePanel
          action={action}
          challenge="sleep"
          initialProgress={{
            ...progress,
            level: "sprout",
            xp: 10,
            badge: "first-step",
            completedCycles: 1,
            completedDates: ["2026-08-10"],
          }}
          signedIn
          signInHref="/auth/signin"
        />,
      );

      expect(
        screen.getByRole("heading", { name: "Tu semilla despertó" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Nivel: Brote")).toBeInTheDocument();
      expect(screen.getAllByText("10 puntos")).toHaveLength(2);
      expect(
        screen.getByRole("button", { name: "Compartir con la comunidad" }),
      ).toBeInTheDocument();
    });

    it("offers withdrawal when the celebration is already public", () => {
      renderWithIntl(
        <HabitChallengePanel
          action={action}
          challenge="sleep"
          initialProgress={{
            ...progress,
            level: "sprout",
            xp: 10,
            badge: "first-step",
            celebrationStatus: "active",
            completedCycles: 1,
            completedDates: ["2026-08-10"],
          }}
          signedIn
          signInHref="/auth/signin"
        />,
      );

      expect(
        screen.getByRole("button", { name: "Dejar de compartir" }),
      ).toBeInTheDocument();
    });

    it("shows seven local days and keeps check-in available after the first cycle", () => {
      renderWithIntl(
        <HabitChallengePanel
          action={action}
          challenge="sleep"
          initialProgress={{
            ...progress,
            level: "sprout",
            xp: 20,
            badge: "first-step",
            completedCycles: 2,
            completedDates: ["2026-08-06", "2026-08-07"],
          }}
          signedIn
          signInHref="/auth/signin"
        />,
      );

      expect(screen.getByText("2 de 7 ciclos")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Registrar este ciclo" }),
      ).toBeInTheDocument();
      expect(screen.getAllByTestId("challenge-day")).toHaveLength(7);
    });

    it("shows a stronger final celebration without claiming a habit was formed", () => {
      renderWithIntl(
        <HabitChallengePanel
          action={action}
          challenge="sleep"
          initialProgress={{
            ...progress,
            level: "harvest",
            xp: 50,
            badge: "harvest",
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
          name: "Protegiste tu descanso cinco veces",
        }),
      ).toBeInTheDocument();
      expect(screen.getByText("Cosecha de descanso")).toBeInTheDocument();
      expect(
        screen.getByText(/siete días no bastan para afirmar/i),
      ).toBeInTheDocument();
    });
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
