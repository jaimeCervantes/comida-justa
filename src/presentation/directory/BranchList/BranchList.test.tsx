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

  describe("el enlace al punto guardado", () => {
    const CHECK = es.account.branchCheckPoint;

    /* Lo que se enseñaba era el enlace que pegó el vendedor, y ese siempre le parece correcto
       porque es el suyo. Lo que decide si aparece en las búsquedas por cercanía es el punto
       guardado, y no se veía en ninguna pantalla. */
    it("lleva a las coordenadas guardadas, no a lo que dice el enlace pegado", () => {
      renderWithIntl(
        <BranchList
          branches={[
            branch({ mapUrl: "https://maps.app.goo.gl/otro-sitio-distinto" }),
          ]}
          emptyMessage={EMPTY_MESSAGE}
          checkPointLabel={CHECK}
        />,
      );

      expect(screen.getByRole("link", { name: CHECK })).toHaveAttribute(
        "href",
        "https://www.google.com/maps?q=18.6013,-96.7089",
      );
    });

    /* Comprobar dónde quedó tu sucursal es verificar, no navegar: perder la cuenta a medio
       configurar es justo lo que no quiere quien pulsa aquí. */
    it("se abre en una pestaña nueva", () => {
      renderWithIntl(
        <BranchList
          branches={[branch()]}
          emptyMessage={EMPTY_MESSAGE}
          checkPointLabel={CHECK}
        />,
      );

      expect(screen.getByRole("link", { name: CHECK })).toHaveAttribute(
        "target",
        "_blank",
      );
    });

    it("convive con el «Ver en el mapa», que sigue llevando al enlace pegado", () => {
      renderWithIntl(
        <BranchList
          branches={[branch()]}
          emptyMessage={EMPTY_MESSAGE}
          checkPointLabel={CHECK}
        />,
      );

      expect(
        screen.getByRole("link", { name: es.branches.seeOnMap }),
      ).toHaveAttribute("href", MAP_URL);
      expect(screen.getByRole("link", { name: CHECK })).toBeInTheDocument();
    });

    /* La página pública no lo pasa: a un visitante no le sirve de nada saber dónde cree la base
       que está la tienda. */
    it("no se ofrece cuando quien monta la lista no lo pide", () => {
      renderWithIntl(
        <BranchList branches={[branch()]} emptyMessage={EMPTY_MESSAGE} />,
      );

      expect(
        screen.queryByTestId("branch-check-point"),
      ).not.toBeInTheDocument();
    });
  });
});
