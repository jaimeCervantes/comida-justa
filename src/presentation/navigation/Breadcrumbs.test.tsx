import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import Breadcrumbs from "./Breadcrumbs";

const camino = [
  { label: "Inicio", href: "/" as const },
  {
    label: "Alimentación",
    href: {
      pathname: "/categoria/[key]",
      params: { key: "alimentacion" },
    } as const,
  },
  { label: "Panadería" },
];

describe("Breadcrumbs", () => {
  it("enlaza los pasos anteriores y deja el actual sin enlace", () => {
    renderWithIntl(<Breadcrumbs items={camino} ariaLabel="Ruta" />);

    expect(screen.getByRole("link", { name: "Inicio" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Alimentación" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Panadería" })).toBeNull();
  });

  it("marca la página actual para quien navega con lector de pantalla", () => {
    renderWithIntl(<Breadcrumbs items={camino} ariaLabel="Ruta" />);

    expect(screen.getByText("Panadería")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("no pinta nada cuando el camino es la propia página", () => {
    const { container } = renderWithIntl(
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }]} ariaLabel="Ruta" />,
    );

    expect(container.innerHTML).toBe("");
  });
});
