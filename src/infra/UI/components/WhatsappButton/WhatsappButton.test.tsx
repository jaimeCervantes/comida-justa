import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import WhatsappButton from "./WhatsappButton";

describe("WhatsappButton", () => {
  it("abre el enlace en otra pestaña sin filtrar la sesión", () => {
    const { getByTestId } = render(
      <WhatsappButton href="https://wa.me/522781126948?text=Hola">
        Pedir por WhatsApp
      </WhatsappButton>,
    );

    const link = getByTestId("whatsapp-cta");

    expect(link).toHaveAttribute(
      "href",
      "https://wa.me/522781126948?text=Hola",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("no pinta nada cuando no hay número al que escribir", () => {
    const { queryByTestId } = render(
      <WhatsappButton href={null}>Pedir por WhatsApp</WhatsappButton>,
    );

    expect(queryByTestId("whatsapp-cta")).not.toBeInTheDocument();
  });
});
