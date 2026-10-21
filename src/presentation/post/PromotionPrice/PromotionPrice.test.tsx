import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import PromotionPrice from "./PromotionPrice";

/* La vigencia sale del reloj, así que la prueba fija el reloj. */
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-20T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PromotionPrice", () => {
  it("en promoción tacha el normal, enseña la rebaja y cuánto se ahorra", () => {
    render(<PromotionPrice price={180} salePrice={150} />);

    expect(screen.getByTestId("promotion-regular-price")).toHaveTextContent(
      "$180.00",
    );
    expect(screen.getByTestId("promotion-sale-price")).toHaveTextContent(
      "$150.00",
    );
    expect(screen.getByTestId("promotion-discount")).toHaveTextContent("-17%");
    expect(screen.queryByTestId("promotion-ends")).not.toBeInTheDocument();
  });

  it("con fecha de fin, dice hasta cuándo", () => {
    render(
      <PromotionPrice
        price={180}
        salePrice={150}
        saleEndsAt="2026-11-30T18:00:00Z"
      />,
    );

    expect(screen.getByTestId("promotion-ends")).toHaveTextContent(
      /30 de noviembre/,
    );
  });

  it("vencida, enseña solo el precio normal", () => {
    render(
      <PromotionPrice
        price={180}
        salePrice={150}
        saleEndsAt="2026-10-19T12:00:00Z"
      />,
    );

    expect(screen.queryByTestId("promotion-price")).not.toBeInTheDocument();
    expect(screen.getByText("$180.00")).toBeInTheDocument();
  });

  it("sin precio no pinta nada, como un anuncio", () => {
    const { container } = render(<PromotionPrice price={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
