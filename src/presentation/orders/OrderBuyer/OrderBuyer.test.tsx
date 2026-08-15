import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import OrderBuyer from "./OrderBuyer";

/**
 * Quien pidió, en la tarjeta del vendedor. Las tres columnas de las que sale son nulas en la base
 * —`users.name`, `users.username` y `users.image`—, así que las tres combinaciones que importan son
 * de verdad alcanzables y no casos inventados.
 */
describe("OrderBuyer", () => {
  it("enlaza al perfil cuando la cuenta eligió su dirección", () => {
    render(
      <OrderBuyer
        name="Jaime Cervantes"
        handle="jaime-cervantes"
        image={null}
      />,
    );

    const link = screen.getByTestId("order-buyer");

    expect(link).toHaveTextContent("Lo pidió Jaime Cervantes");
    expect(link).toHaveAttribute("href", "/u/jaime-cervantes");
  });

  /* Hoy sólo 1 de 21 cuentas tiene `username`. Enlazar a ciegas mandaría a la mayoría a un 404, así
     que sin él se lee el nombre y ya: la información no se pierde, el enlace sí. */
  it("sin username dice el nombre, sin enlace", () => {
    render(<OrderBuyer name="Jaime Cervantes" handle={null} image={null} />);

    const identity = screen.getByTestId("order-buyer");

    expect(identity).toHaveTextContent("Lo pidió Jaime Cervantes");
    expect(identity.tagName).not.toBe("A");
  });

  /* `users.name` también es nulo. Que el pedido tiene dueño es información aunque no se le pueda
     poner nombre, y dejar "Lo pidió " a medias sería peor que decirlo. */
  it("sin nombre cae al username, y sin ninguno de los dos lo dice igual", () => {
    const { unmount } = render(
      <OrderBuyer name={null} handle="jaime-cervantes" image={null} />,
    );

    expect(screen.getByTestId("order-buyer")).toHaveTextContent(
      "Lo pidió jaime-cervantes",
    );

    unmount();
    render(<OrderBuyer name={null} handle={null} image={null} />);

    expect(screen.getByTestId("order-buyer")).toHaveTextContent(
      "Lo pidió alguien",
    );
  });
});
