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

  it("en la esquina se lee igual, en una banda dentro de un marco que la recorta", () => {
    render(<PromotionRibbon price={75} salePrice={60} variant="corner" />);

    const ribbon = screen.getByTestId("promotion-ribbon");

    expect(ribbon).toHaveTextContent("Promoción · -20%");
    /* El marco recorta la banda: sin esto, lo girado se sale de la foto. */
    expect(ribbon.className).toContain("overflow-hidden");
  });

  it("vencida tampoco pinta la esquina", () => {
    const { container } = render(
      <PromotionRibbon
        price={75}
        salePrice={60}
        saleEndsAt="2026-10-20T12:00:00Z"
        variant="corner"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
