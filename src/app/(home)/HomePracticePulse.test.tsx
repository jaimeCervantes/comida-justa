import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import HomePracticePulse from "./HomePracticePulse";

describe("HomePracticePulse", () => {
  it("muestra actividad semanal real como una puerta a pilares", () => {
    renderWithIntl(<HomePracticePulse weeklyPractitioners={3} />);

    const pulse = screen.getByTestId("home-practice-pulse");

    expect(pulse).toHaveTextContent("3 personas están practicando esta semana");
    expect(
      screen.getByRole("link", { name: /elegir una práctica/i }),
    ).toHaveAttribute("href", "/pilares");
  });

  it("no convierte el pulso en competencia", () => {
    renderWithIntl(<HomePracticePulse weeklyPractitioners={1} />);

    expect(screen.getByTestId("home-practice-pulse")).not.toHaveTextContent(
      /campe[oó]n|ranking|primer lugar|ganador/i,
    );
  });

  it("invita a empezar cuando la semana no tiene actividad", () => {
    renderWithIntl(<HomePracticePulse weeklyPractitioners={0} />);

    expect(screen.getByTestId("home-practice-pulse")).toHaveTextContent(
      "Todavía nadie ha practicado esta semana",
    );
  });
});
