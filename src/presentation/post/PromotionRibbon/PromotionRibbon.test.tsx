import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import PromotionRibbon from "./PromotionRibbon";

/* La vigencia sale del reloj, así que la prueba fija el reloj. */
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-21T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PromotionRibbon", () => {
  it("con promoción vigente dice que hay promoción y cuánto se ahorra", () => {
    render(<PromotionRibbon price={180} salePrice={150} />);

    expect(screen.getByTestId("promotion-ribbon")).toHaveTextContent(
      "Promoción · -17%",
    );
  });

  it("vencida o sin rebaja no pinta nada", () => {
    const { container } = render(
      <>
        <PromotionRibbon
          price={180}
          salePrice={150}
          saleEndsAt="2026-10-20T12:00:00Z"
        />
        <PromotionRibbon price={180} />
        <PromotionRibbon price={null} salePrice={150} />
      </>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
