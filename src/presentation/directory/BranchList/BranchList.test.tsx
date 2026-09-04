import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Branch } from "~/domain/entities/seller/types";
import en from "~/i18n/messages/en.json";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import BranchList from "./BranchList";

const EMPTY_MESSAGE = "Todavía no tienes sucursales.";
const MAP_URL = "https://maps.app.goo.gl/8M3zwu2aE6o8itKZ6";

function branch(patch: Partial<Branch> = {}): Branch {
  return {
    id: "branch-1",
    sellerId: "seller-1",
    name: "Sucursal Centro",
    address: "Calle Principal 1, Tezonapa",
    mapUrl: MAP_URL,
    coordinates: { latitude: 18.6013, longitude: -96.7089 },
    ...patch,
  };
}

describe("BranchList", () => {
  it("dice lo que quien la monta haya decidido cuando no hay ninguna", () => {
    renderWithIntl(<BranchList branches={[]} emptyMessage={EMPTY_MESSAGE} />);

    expect(screen.getByTestId("branches-empty")).toHaveTextContent(
      EMPTY_MESSAGE,
    );
  });

  it("nombra cada sucursal con su dirección", () => {
    renderWithIntl(
      <BranchList branches={[branch()]} emptyMessage={EMPTY_MESSAGE} />,
    );

    const item = screen.getByTestId("branch-item");

    expect(item).toHaveTextContent("Sucursal Centro");
    expect(item).toHaveTextContent("Calle Principal 1, Tezonapa");
  });

  /* Estaba en duro en español, y esta lista se pinta también en la página pública de la tienda: un
     visitante inglés leía «Ver en el mapa» en medio de su idioma. */
  describe("el enlace al mapa se lee en el idioma de quien mira", () => {
    it.each([
      ["es", es.branches.seeOnMap],
      ["en", en.branches.seeOnMap],
    ] as const)("en %s dice %j", (locale, label) => {
      renderWithIntl(
        <BranchList branches={[branch()]} emptyMessage={EMPTY_MESSAGE} />,
        { locale },
      );

      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        MAP_URL,
      );
    });
  });

  it("no ofrece enlace al mapa cuando la sucursal no trae ninguno", () => {
    renderWithIntl(
      <BranchList
        branches={[branch({ mapUrl: "" })]}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
