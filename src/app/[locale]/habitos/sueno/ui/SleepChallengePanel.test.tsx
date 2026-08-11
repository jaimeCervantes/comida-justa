import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type { AtomicSleepProgress } from "~/use_cases/habits/atomicSleepChallengeUseCase";
import SleepChallengePanel from "./SleepChallengePanel";

vi.mock("../actions", () => ({
  manageAtomicSleepChallenge: vi.fn(),
}));

describe("SleepChallengePanel", () => {
  const progress = (
    overrides: Partial<AtomicSleepProgress>,
  ): AtomicSleepProgress => ({
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
    ...overrides,
  });

  it("starts with one clear action before progress exists", () => {
    renderWithIntl(
      <SleepChallengePanel
        initialProgress={null}
        signedIn
        signInHref="/auth/signin?callbackUrl=%2Fhabitos%2Fsueno"
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
      <SleepChallengePanel
        initialProgress={progress({})}
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
      <SleepChallengePanel
        initialProgress={progress({
          level: "sprout",
          xp: 10,
          badge: "first-step",
          celebrationStatus: "absent",
          completedCycles: 1,
          completedDates: ["2026-08-10"],
        })}
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
      <SleepChallengePanel
        initialProgress={progress({
          level: "sprout",
          xp: 10,
          badge: "first-step",
          celebrationStatus: "active",
          completedCycles: 1,
          completedDates: ["2026-08-10"],
        })}
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
      <SleepChallengePanel
        initialProgress={progress({
          level: "sprout",
          xp: 20,
          badge: "first-step",
          completedCycles: 2,
          completedDates: ["2026-08-06", "2026-08-07"],
        })}
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
      <SleepChallengePanel
        initialProgress={progress({
          level: "harvest",
          xp: 50,
          badge: "sleep-harvest",
          completedCycles: 5,
          completedDates: [
            "2026-08-06",
            "2026-08-07",
            "2026-08-08",
            "2026-08-09",
            "2026-08-10",
          ],
          succeeded: true,
        })}
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
