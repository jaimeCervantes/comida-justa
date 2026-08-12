import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import SuenoPage from "./SuenoPage";

vi.mock("./SleepPracticeSection", () => ({
  default: () => <section data-testid="sleep-practice" />,
}));

describe("SuenoPage", () => {
  it("presents the page title, introduction and identity in one visual hero", () => {
    renderWithIntl(<SuenoPage locale="es" />);

    const title = screen.getByRole("heading", {
      level: 1,
      name: "1. Sueño y Descanso",
    });
    const hero = title.closest("header");

    expect(hero?.className).toContain("bg-[linear-gradient");
    expect(
      within(hero as HTMLElement).getByText(
        "La base de la recuperación biológica y la salud a largo plazo.",
      ),
    ).toBeInTheDocument();
    expect(
      within(hero as HTMLElement).getByText(
        /Soy una persona que protege su descanso/,
      ),
    ).toBeInTheDocument();
  });
});
