import { describe, expect, it } from "vitest";
import type { AppLocale } from "~/i18n/routing";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import StockRemaining from "./StockRemaining";

describe("StockRemaining", () => {
  it.each<[AppLocale, number, RegExp]>([
    ["es", 3, /quedan 3/i],
    ["es", 1, /queda 1/i],
    ["en", 3, /3 left/i],
  ])("en %s con %i unidades dice %s", (locale, stockQuantity, expected) => {
    const { getByTestId } = renderWithIntl(
      <StockRemaining kind="producto" stockQuantity={stockQuantity} />,
      { locale },
    );

    expect(getByTestId("stock-remaining")).toHaveTextContent(expected);
  });

  it.each([
    ["no lleva inventario y nulo no es cero", "producto", null],
    ["está agotado y eso ya lo dice la insignia de agotado", "producto", 0],
    ["un servicio no se entrega en piezas", "servicio", 5],
    ["un evento no se agota, caduca", "evento", 5],
    ["un anuncio no se vende", "anuncio", 5],
  ])("se calla cuando %s", (_caso, kind, stockQuantity) => {
    const { queryByTestId } = renderWithIntl(
      <StockRemaining kind={kind} stockQuantity={stockQuantity} />,
    );

    expect(queryByTestId("stock-remaining")).not.toBeInTheDocument();
  });
});
