import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type { OffersSlide } from "./homeOffers";
import OffersCarousel from "./OffersCarousel";

/** Slices 1 y 2 de `docs/features/commerce/032-2026-10-21-ofertas-en-portada.md`. */
const GENERAL: OffersSlide = {
  key: "general",
  label: null,
  images: {
    ancho: "/api/ofertas/banner?locale=es&formato=ancho&v=abc",
    compacto: "/api/ofertas/banner?locale=es&formato=compacto&v=abc",
  },
  alt: "Ofertas: Miel de abeja 500 g -17%",
  catalogQuery: { promocion: "1" },
};

const APIS: OffersSlide = {
  key: "brand:apis",
  label: "Apis",
  images: {
    ancho: "/api/ofertas/banner?locale=es&formato=ancho&marca=Apis&v=def",
    compacto: "/api/ofertas/banner?locale=es&formato=compacto&marca=Apis&v=def",
  },
  alt: "Ofertas de Apis: Miel de abeja 500 g -17%, Miel 1 kg -17%",
  catalogQuery: { promocion: "1", marca: "Apis" },
};

describe("OffersCarousel", () => {
  it("el banner general lleva a la lista de ofertas", () => {
    renderWithIntl(<OffersCarousel slides={[GENERAL]} />);

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
    const { container } = renderWithIntl(<OffersCarousel slides={[GENERAL]} />);

    expect(screen.getByTestId("home-offers-banner-image")).toHaveAttribute(
      "src",
      GENERAL.images.compacto,
    );
    expect(container.querySelector("source")).toHaveAttribute(
      "srcset",
      GENERAL.images.ancho,
    );
  });

  it("un slide por marca, después del general, que lleva a las ofertas de esa marca", () => {
    renderWithIntl(<OffersCarousel slides={[GENERAL, APIS]} />);

    const banners = screen.getAllByTestId("home-offers-banner");

    expect(banners.map((banner) => banner.dataset.slide)).toEqual([
      "general",
      "brand:apis",
    ]);
    expect(banners[1]).toHaveAttribute(
      "href",
      "/productos?promocion=1&marca=Apis",
    );
    /* El primero carga de inmediato; los demás esperan su turno. */
    expect(
      within(banners[1]).getByRole("img", { hidden: true }),
    ).toHaveAttribute("loading", "lazy");
    expect(
      screen.getByRole("button", { name: "Siguiente" }),
    ).toBeInTheDocument();
  });
});
