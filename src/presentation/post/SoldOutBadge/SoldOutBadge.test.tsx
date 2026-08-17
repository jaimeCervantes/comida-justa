import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AppLocale } from "~/i18n/routing";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import SoldOutBadge from "./SoldOutBadge";

describe("SoldOutBadge", () => {
  /* "Agotado" y "Sold out" sí difieren entre catálogos, a diferencia de las insignias de
     procedencia: este caso es el que demuestra que el idioma pedido llega de verdad al render. */
  it.each<[AppLocale, string]>([
    ["es", "Agotado"],
    ["en", "Sold out"],
  ])("marca el producto agotado en %s", (locale, expected) => {
    const { getByTestId } = renderWithIntl(
      <SoldOutBadge kind="producto" isAvailable={false} />,
      { locale },
    );

    expect(getByTestId("sold-out-badge")).toHaveTextContent(expected);
  });

  it.each([
    ["hay existencias", "producto", true],
    ["es un anuncio, que no se agota", "anuncio", false],
  ])("no pinta nada cuando %s", (_caso, kind, isAvailable) => {
    const { queryByTestId } = renderWithIntl(
      <SoldOutBadge kind={kind} isAvailable={isAvailable} />,
    );

    expect(queryByTestId("sold-out-badge")).not.toBeInTheDocument();
  });
});

/* "Agotado" es verdad de una mercancía y mentira de un servicio: a una masajista no se le acaban
   los masajes, deja de ofrecerlos. */
describe("SoldOutBadge — servicios", () => {
  it("un servicio dice que ya no se ofrece, no que se agotó", () => {
    renderWithIntl(<SoldOutBadge kind="servicio" isAvailable={false} />);

    expect(screen.getByTestId("sold-out-badge")).toHaveTextContent(
      /ya no se ofrece/i,
    );
  });

  it("un producto sigue diciendo agotado", () => {
    renderWithIntl(<SoldOutBadge kind="producto" isAvailable={false} />);

    expect(screen.getByTestId("sold-out-badge")).toHaveTextContent(/agotado/i);
  });

  it("un servicio que sigue ofreciéndose no pinta nada", () => {
    renderWithIntl(<SoldOutBadge kind="servicio" isAvailable={true} />);

    expect(screen.queryByTestId("sold-out-badge")).not.toBeInTheDocument();
  });
});
