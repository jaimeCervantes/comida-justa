import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PublicationPillarFilter from "./PublicationPillarFilter";

describe("PublicationPillarFilter", () => {
  it("muestra Todo y los cuatro pilares en español", () => {
    renderWithIntl(
      <PublicationPillarFilter currentPillar={null} pathname="/productos" />,
    );

    expect(
      screen.getByRole("navigation", { name: "Filtrar por pilar" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Todo" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Sueño" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Alimentación" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Movimiento" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mente/Espíritu" }),
    ).toBeInTheDocument();
  });

  it("marca el pilar activo y conserva los parametros que no controla", () => {
    renderWithIntl(
      <PublicationPillarFilter
        currentPillar="movement"
        pathname="/buscar"
        query={{ q: "ritual", page: "3" }}
      />,
    );

    expect(screen.getByRole("link", { name: "Movimiento" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Todo" })).toHaveAttribute(
      "href",
      "/buscar?q=ritual",
    );
    expect(screen.getByRole("link", { name: "Sueño" })).toHaveAttribute(
      "href",
      "/buscar?q=ritual&pillar=sleep",
    );
  });

  it("traduce las etiquetas al inglés", () => {
    renderWithIntl(
      <PublicationPillarFilter currentPillar="sleep" pathname="/productos" />,
      { locale: "en" },
    );

    expect(
      screen.getByRole("navigation", { name: "Filter by pillar" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sleep" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Nutrition" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Movement" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mind/Spirit" }),
    ).toBeInTheDocument();
  });
});
