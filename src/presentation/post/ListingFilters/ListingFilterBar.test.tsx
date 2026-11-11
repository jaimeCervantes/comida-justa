import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import ListingFilterBar from "./ListingFilterBar";

describe("La barra de filtros de los listados", () => {
  it("ofrece «Solo con existencia» apagado y lleva a la misma categoría con el filtro", () => {
    renderWithIntl(
      <ListingFilterBar
        pathname="/categoria/[key]"
        params={{ key: "salsas_y_aderezos" }}
        currentPillar={null}
        onlyAvailable={false}
      />,
    );

    const chip = screen.getByTestId("filter-only-available");

    expect(chip).toHaveTextContent("Solo con existencia");
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(chip).toHaveAttribute(
      "href",
      "/categoria/salsas_y_aderezos?disponibles=1",
    );
  });

  it("cambiar un filtro no suelta el otro, ni lo que la barra no controla", () => {
    renderWithIntl(
      <ListingFilterBar
        pathname="/buscar"
        query={{ q: "salsa", page: "3" }}
        currentPillar="nutrition"
        onlyAvailable
      />,
    );

    // Apagar la existencia conserva el pilar y el término; la página vuelve a la 1.
    expect(screen.getByTestId("filter-only-available")).toHaveAttribute(
      "href",
      "/buscar?q=salsa&pillar=nutrition",
    );
    // Cambiar de pilar conserva la existencia.
    expect(screen.getByTestId("filter-pillar-sleep")).toHaveAttribute(
      "href",
      "/buscar?q=salsa&pillar=sleep&disponibles=1",
    );
    expect(screen.getByTestId("filter-pillar-all")).toHaveAttribute(
      "href",
      "/buscar?q=salsa&disponibles=1",
    );
  });

  it("encendido, se marca con la casilla y lo anuncia a un lector de pantalla", () => {
    renderWithIntl(
      <ListingFilterBar
        pathname="/categoria/[key]"
        params={{ key: "salsas_y_aderezos" }}
        currentPillar={null}
        onlyAvailable
      />,
    );

    const chip = screen.getByTestId("filter-only-available");

    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(chip).toHaveTextContent("✓");
    expect(
      screen.getByRole("complementary", { name: "Filtros" }),
    ).toBeInTheDocument();
  });

  it("respeta el prefijo de quien ya tenía su contrato de pruebas", () => {
    renderWithIntl(
      <ListingFilterBar
        pathname="/buscar"
        query={{ q: "salsa" }}
        currentPillar={null}
        onlyAvailable={false}
        testIdPrefix="facet"
      />,
    );

    expect(screen.getByTestId("facet-only-available")).toBeInTheDocument();
    expect(screen.getByTestId("facet-pillar-sleep")).toBeInTheDocument();
  });
});
