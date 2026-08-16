import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OrderStatusChange } from "~/domain/order/order";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import OrderHistory from "./OrderHistory";

/* El pedido real del 10 de agosto, con el recorrido que NO se pudo guardar entonces: se creó a la
   01:58 y terminó a las 03:25, y lo de en medio se perdió. Aquí está lo que ahora sí se registra. */
/* Sin los segundos que sí lleva la fila real (`01:58:42.873`): el dominio trunca hacia abajo —un
   paso de 89 s tardó "1 min", no 2— y con segundos sueltos la aritmética de estos casos dejaría de
   leerse de un vistazo. Que trunca lo prueba `order.test.ts`, que es donde vive la regla. */
const createdAt = new Date("2026-08-10T01:58:00.000Z");

const paso = (
  from: OrderStatusChange["from"],
  to: OrderStatusChange["to"],
  hhmm: string,
): OrderStatusChange => ({
  from,
  to,
  at: new Date(`2026-08-10T${hhmm}:00.000Z`),
});

const recorrido = [
  paso("PENDING", "CONFIRMED", "02:14"),
  paso("CONFIRMED", "PREPARING", "02:40"),
  paso("PREPARING", "DELIVERED", "03:25"),
];

const steps = () => screen.getAllByTestId("order-history-step");

describe("OrderHistory", () => {
  it("enseña el nacimiento y cada paso, en orden", () => {
    render(
      <OrderHistory
        order={{ createdAt, status: "DELIVERED" }}
        history={recorrido}
      />,
    );

    /* Cuatro y no tres: el primero es "Pendiente", que sale de `createdAt` y no del histórico —
       nacer no es un cambio, y repetirlo como fila sería copiar una columna que ya está. */
    expect(steps()).toHaveLength(4);
    expect(steps()[0]).toHaveTextContent("Pendiente");
    expect(steps()[1]).toHaveTextContent("Aceptado");
    expect(steps()[3]).toHaveTextContent("Entregado");
  });

  it("dice cuánto pasó entre un paso y el siguiente", () => {
    render(
      <OrderHistory
        order={{ createdAt, status: "DELIVERED" }}
        history={recorrido}
      />,
    );

    // 01:58 → 02:14 son 16 minutos; 02:40 → 03:25, 45.
    expect(steps()[1]).toHaveTextContent("16 min después");
    expect(steps()[3]).toHaveTextContent("45 min después");
  });

  /* El primer punto no tiene "antes", así que no lleva duración: sería el tiempo transcurrido desde
     nada. */
  it("el primer paso no dice ninguna duración", () => {
    render(
      <OrderHistory order={{ createdAt, status: "PENDING" }} history={[]} />,
    );

    expect(steps()[0]).not.toHaveTextContent("después");
  });

  /* Lo que NO se hizo: rellenar hacia atrás. Un pedido anterior a la migración no tiene recorrido y
     no se le inventa uno — se explica por qué falta. */
  it("un pedido sin recorrido lo dice, en vez de fingir uno", () => {
    render(
      <OrderHistory order={{ createdAt, status: "DELIVERED" }} history={[]} />,
    );

    expect(steps()).toHaveLength(1);
    expect(screen.getByTestId("order-history-empty")).toBeInTheDocument();
  });

  it("y uno con recorrido no da esa explicación", () => {
    render(
      <OrderHistory
        order={{ createdAt, status: "DELIVERED" }}
        history={recorrido}
      />,
    );

    expect(screen.queryByTestId("order-history-empty")).not.toBeInTheDocument();
  });
});
