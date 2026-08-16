import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OrderStatus } from "~/domain/order/order";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import OrderClosedOn from "./OrderClosedOn";

/* La hora del pedido real del 10 de agosto: se creó a la 01:58 y terminó a las 03:25. */
const updatedAt = new Date("2026-08-10T03:25:39.277Z");

const closedOn = () => screen.queryByTestId("order-closed-on");

/**
 * La corrida de escritorio de `orders.feature` (@slice-8): cuándo se enseña la fecha del último
 * paso. `updatedAt` dice desde cuándo el pedido está como está, así que **sólo** para un estado
 * final significa "se entregó/canceló entonces".
 */
describe("OrderClosedOn", () => {
  it("un pedido entregado dice cuándo se entregó, con fecha y hora", () => {
    render(<OrderClosedOn order={{ status: "DELIVERED", updatedAt }} />);

    expect(closedOn()).toHaveTextContent("Entregado el");
    // La hora, no sólo el día: es la mitad de lo que se pidió.
    expect(closedOn()).toHaveTextContent(/\d{1,2}:\d{2}/);
  });

  it("y uno cancelado, que es otra noticia distinta", () => {
    render(<OrderClosedOn order={{ status: "CANCELLED", updatedAt }} />);

    expect(closedOn()).toHaveTextContent("Cancelado el");
  });

  /* Enseñar el `updatedAt` de un PREPARING como fecha de entrega sería mentir con un dato correcto:
     dice cuándo empezó a prepararse. */
  it.each([["PENDING"], ["CONFIRMED"], ["PREPARING"]] as Array<[OrderStatus]>)(
    "un pedido en %s no enseña ninguna fecha de cierre",
    (status) => {
      render(<OrderClosedOn order={{ status, updatedAt }} />);

      expect(closedOn()).not.toBeInTheDocument();
    },
  );

  it("en inglés lo dice en inglés", () => {
    render(<OrderClosedOn order={{ status: "DELIVERED", updatedAt }} />, {
      locale: "en",
    });

    expect(closedOn()).toHaveTextContent("Delivered on");
  });
});
