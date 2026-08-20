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

  /**
   * `pillarPalette.contrast.test.ts` dejó medido desde el slice 3 que Movimiento (#3c7b0f) y Mente
   * (#0369a1) contrastan 1.14 entre sí como tinta: quien no distingue el tono no sabe qué filtro
   * está pulsando. El número es lo que lo desambigua.
   *
   * Va `aria-hidden` a propósito: es una redundancia visual para una limitación visual, y quien usa
   * un lector de pantalla ya recibe la etiqueta sin ambigüedad. Por eso el nombre accesible del
   * enlace sigue siendo "Movimiento" y no "3 Movimiento" — que además es lo que mantiene en pie el
   * contrato de `getByRole` en estas pruebas y en el e2e.
   */
  it("cada pilar enseña su número sin metérselo al lector de pantalla", () => {
    renderWithIntl(
      <PublicationPillarFilter currentPillar={null} pathname="/productos" />,
    );

    for (const [label, number] of [
      ["Sueño", "1"],
      ["Alimentación", "2"],
      ["Movimiento", "3"],
      ["Mente/Espíritu", "4"],
    ] as const) {
      const link = screen.getByRole("link", { name: label });

      expect(link).toHaveTextContent(number);
      expect(link.querySelector("[aria-hidden='true']")).toHaveTextContent(
        number,
      );
    }
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
