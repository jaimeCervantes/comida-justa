import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import OffersCarousel from "./OffersCarousel";

/** Slice 1 de `docs/features/commerce/032-2026-10-21-ofertas-en-portada.md`. */
const OFFERS = {
  images: {
    ancho: "/api/ofertas/banner?locale=es&formato=ancho&v=abc",
    compacto: "/api/ofertas/banner?locale=es&formato=compacto&v=abc",
  },
  alt: "Ofertas: Miel de abeja 500 g -17%",
  count: 1,
};

describe("OffersCarousel", () => {
  it("lleva el banner, que va a la lista de ofertas", () => {
    renderWithIntl(<OffersCarousel offers={OFFERS} />);

    const banner = within(screen.getByTestId("home-offers")).getByTestId(
      "home-offers-banner",
    );

    expect(banner).toHaveAttribute("href", "/productos?promocion=1");
    expect(within(banner).getByRole("img")).toHaveAttribute(
      "alt",
      "Ofertas: Miel de abeja 500 g -17%",
    );
  });

  it("el teléfono descarga el formato compacto y el escritorio el ancho", () => {
    const { container } = renderWithIntl(<OffersCarousel offers={OFFERS} />);

    expect(screen.getByTestId("home-offers-banner-image")).toHaveAttribute(
      "src",
      OFFERS.images.compacto,
    );
    expect(container.querySelector("source")).toHaveAttribute(
      "srcset",
      OFFERS.images.ancho,
    );
  });
});
