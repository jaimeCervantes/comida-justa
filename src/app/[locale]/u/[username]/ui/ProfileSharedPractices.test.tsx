import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type { ProfileSharedPractice } from "../types";
import ProfileSharedPractices from "./ProfileSharedPractices";

function practice(
  overrides: Partial<ProfileSharedPractice> = {},
): ProfileSharedPractice {
  return {
    key: "sleep-dark-room",
    title: "Penumbra total",
    summary: "Dormir en oscuridad cuida el descanso.",
    cue: "Al cerrar la casa por la noche.",
    minimum: "Apaga la pantalla grande.",
    effortMinutes: null,
    costLevel: 0,
    pillars: ["sleep"],
    studyCount: 2,
    challengeKey: null,
    startedAt: new Date("2026-08-10T06:00:00Z"),
    ...overrides,
  };
}

describe("ProfileSharedPractices", () => {
  it("agrupa las practicas compartidas por pilar y muestra su ancla", () => {
    renderWithIntl(
      <ProfileSharedPractices
        practices={[
          practice(),
          practice({
            key: "movement-two-minutes",
            title: "Dos minutos de movimiento",
            summary: "Moverse un poco rompe el sedentarismo.",
            cue: "Despues del primer cafe.",
            minimum: "Dos minutos cuentan.",
            pillars: ["movement"],
          }),
        ]}
      />,
    );

    const section = screen.getByTestId("public-shared-practices");
    expect(
      within(section).getByRole("heading", {
        name: "Prácticas que comparte",
      }),
    ).toBeVisible();
    expect(
      within(section).getByRole("heading", { name: "Sueño" }),
    ).toBeVisible();
    expect(
      within(section).getByRole("heading", { name: "Movimiento" }),
    ).toBeVisible();
    expect(within(section).getByText("Penumbra total")).toBeVisible();
    expect(
      within(section).getByText("Al cerrar la casa por la noche."),
    ).toBeVisible();
    expect(within(section).getAllByText(/Desde/)).toHaveLength(2);
  });

  it("no introduce competencia personal", () => {
    renderWithIntl(<ProfileSharedPractices practices={[practice()]} />);

    const text = screen
      .getByTestId("public-shared-practices")
      .textContent?.toLowerCase();
    expect(text).not.toContain("campe");
    expect(text).not.toContain("ganador");
    expect(text).not.toContain("primer lugar");
    expect(text).not.toContain("ranking");
  });

  it("explica cuando la practica completa ya es el minimo", () => {
    renderWithIntl(
      <ProfileSharedPractices practices={[practice({ minimum: null })]} />,
    );

    expect(
      screen.getByText("La práctica completa ya es el mínimo."),
    ).toBeVisible();
  });

  it("si no hay practicas compartidas, no ocupa espacio en el perfil", () => {
    const { container } = renderWithIntl(
      <ProfileSharedPractices practices={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
