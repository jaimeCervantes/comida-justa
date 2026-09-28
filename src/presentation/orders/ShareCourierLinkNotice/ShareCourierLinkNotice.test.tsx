import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import ShareCourierLinkNotice from "./ShareCourierLinkNotice";

const URL = "https://hazlosano.com/pedido/a7fd1c34/repartidor/tok_123";

describe("ShareCourierLinkNotice", () => {
  it("enseña el enlace como texto, para copiarlo", () => {
    render(<ShareCourierLinkNotice url={URL} />);

    expect(screen.getByTestId("courier-link-url")).toHaveTextContent(URL);
    expect(screen.getByTestId("courier-link-url")).toHaveAttribute("href", URL);
  });

  /* Sin número de destino: el repartidor no tiene teléfono conocido por el sitio, así que el botón
     abre `wa.me` sin número y deja que WhatsApp ofrezca el selector de contacto. */
  it("el botón de WhatsApp manda el enlace, sin número de destino", () => {
    render(<ShareCourierLinkNotice url={URL} />);

    const href =
      screen.getByTestId("courier-link-whatsapp").getAttribute("href") ?? "";

    expect(href).toContain("https://wa.me/?text=");
    expect(decodeURIComponent(href.split("text=")[1] ?? "")).toContain(URL);
  });

  /* @slice-15: el vendedor tiene que saber PARA QUÉ manda el enlace, y el repartidor, que la página
     solo funciona abierta y a la vista. */
  it("dice que con el enlace el cliente verá al repartidor en un mapa", () => {
    render(<ShareCourierLinkNotice url={URL} />);

    expect(screen.getByTestId("courier-link-notice")).toHaveTextContent(
      /cliente verá al repartidor en un mapa/,
    );
  });

  it("el mensaje de WhatsApp le pide al repartidor dejar la página abierta", () => {
    render(<ShareCourierLinkNotice url={URL} />);

    const href =
      screen.getByTestId("courier-link-whatsapp").getAttribute("href") ?? "";
    const message = decodeURIComponent(href.split("text=")[1] ?? "");

    expect(message).toMatch(/abierto y a la vista/);
    expect(message).toMatch(/mapa/);
  });

  it("en inglés lo dice en inglés", () => {
    render(<ShareCourierLinkNotice url={URL} />, { locale: "en" });

    expect(
      screen.getByText("Share this link with the courier"),
    ).toBeInTheDocument();
  });
});
