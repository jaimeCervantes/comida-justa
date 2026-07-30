import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import Footer from "./Footer";

describe("When the footer is rendered", () => {
  /**
   * Regresión: el logotipo se pintaba con un degradado recortado contra el texto
   * (`bg-clip-text text-transparent`) cuyo primer tope apuntaba a `--highlight`, un token que se
   * perdió al mudar los colores a `design_system/tokens`. Sin ese color el arranque quedaba
   * transparente y "Hazlo" era ilegible sobre fondo claro.
   */
  it("Then the brand name is painted with a solid color, not clipped from a gradient", () => {
    const view = render(<Footer />);
    const wordmark = view.getByText(PUBLIC_BRAND_NAME);

    expect(wordmark).not.toHaveClass("text-transparent");
    expect(wordmark).not.toHaveClass("bg-clip-text");
    expect(wordmark).toHaveClass("text-pw-green");
  });
});
