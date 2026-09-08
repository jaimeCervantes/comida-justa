import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type { WeeklyPillarPracticeProgress } from "~/use_cases/practices/practiceAdoptionUseCase";
import WeeklyPracticeProgress from "./WeeklyPracticeProgress";

function progress(
  overrides: Partial<WeeklyPillarPracticeProgress> = {},
): WeeklyPillarPracticeProgress {
  return {
    pillar: "sleep",
    completedDays: 0,
    countedToday: false,
    ...overrides,
  };
}

describe("avance semanal de prácticas", () => {
  it("hace visible cuántos pilares cuentan hoy", () => {
    renderWithIntl(
      <WeeklyPracticeProgress
        signedIn
        progress={[
          progress({ pillar: "sleep", completedDays: 2, countedToday: true }),
          progress({ pillar: "nutrition" }),
          progress({ pillar: "movement" }),
          progress({ pillar: "mindSpirit" }),
        ]}
      />,
    );

    expect(
      screen.getByTestId("weekly-practice-progress-summary"),
    ).toHaveTextContent("1 de 4 pilares cuidados hoy");
  });

  it("muestra estado y días de cada pilar sin lenguaje competitivo", () => {
    renderWithIntl(
      <WeeklyPracticeProgress
        signedIn
        progress={[
          progress({ pillar: "sleep", completedDays: 2, countedToday: true }),
          progress({ pillar: "movement", completedDays: 1 }),
        ]}
      />,
    );

    const tablero = screen.getByTestId("weekly-practice-progress");
    expect(within(tablero).getByText("2 días esta semana")).toBeVisible();
    expect(within(tablero).getByText("Ya cuenta hoy")).toBeVisible();
    expect(within(tablero).getByText("Pendiente hoy")).toBeVisible();
    expect(tablero).not.toHaveTextContent(/campe[oó]n|ganador|primer lugar/i);
  });

  it("sin sesión no finge progreso guardado", () => {
    renderWithIntl(
      <WeeklyPracticeProgress signedIn={false} progress={[progress()]} />,
    );

    expect(screen.getByText(/inicia sesión para ver tu semana/i)).toBeVisible();
  });
});
