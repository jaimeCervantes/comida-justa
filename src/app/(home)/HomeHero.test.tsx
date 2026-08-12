import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import HomeHero from "./HomeHero";

describe("HomeHero", () => {
  it("da a la página un único h1, y es la promesa del sitio", () => {
    renderWithIntl(<HomeHero locationPanel={null} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Cuidar tu salud es cuidar tu tiempo",
      }),
    ).toBeInTheDocument();
  });

  it("pinta la ubicación que le pasan dentro de la portada", () => {
    renderWithIntl(
      <HomeHero
        locationPanel={<button type="button">Compartir mi ubicación</button>}
      />,
    );

    const hero = screen.getByRole("banner");
    expect(
      screen.getByRole("button", { name: "Compartir mi ubicación" }),
    ).toBeInTheDocument();
    expect(hero).toContainElement(
      screen.getByRole("button", { name: "Compartir mi ubicación" }),
    );
  });

  it("traduce la portada entera, sin castellano escondido en el inglés", () => {
    renderWithIntl(<HomeHero locationPanel={null} />, { locale: "en" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Caring for your health is caring for your time",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Your location")).toBeInTheDocument();
  });
});
