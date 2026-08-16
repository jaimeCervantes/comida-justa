import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OrderStatus } from "~/domain/order/order";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import OrderStatusSince from "./OrderStatusSince";

/* Las horas del pedido real del 10 de agosto: se creó a la 01:58 y terminó a las 03:25. */
const createdAt = new Date("2026-08-10T01:58:42.873Z");
const updatedAt = new Date("2026-08-10T03:25:39.277Z");

const since = () => screen.queryByTestId("order-status-since");

/**
 * La fecha que acompaña a la insignia.
 *
 * El defecto que arregla: ahí iba `createdAt`, así que un pedido "Aceptado" enseñaba el día en que
 * se hizo y se leía como el día en que se aceptó. Y `OrderClosedOn`, su primera versión, sólo
 * hablaba de los estados finales — un "Aceptado" o un "En preparación" se quedaban sin fecha.
 */
describe("OrderStatusSince", () => {
  it.each([
    ["CONFIRMED", "Aceptado el"],
    ["PREPARING", "En preparación desde el"],
    ["DELIVERED", "Entregado el"],
    ["CANCELLED", "Cancelado el"],
  ] as Array<[OrderStatus, string]>)(
    "%s se lee entero: «%s …»",
    (status, texto) => {
      render(<OrderStatusSince order={{ status, createdAt, updatedAt }} />);

      expect(since()).toHaveTextContent(texto);
      // Con hora, no sólo el día: dos pasos del mismo día tienen que poder distinguirse.
      expect(since()).toHaveTextContent(/\d{1,2}:\d{2}/);
    },
  );

  /* La frase es entera y no un "desde el…" que dependa de leer la insignia de al lado: quien
     escucha puede llegar aquí solo, y una fecha suelta no dice nada. */
  it("cada estado dice su propio nombre, sin apoyarse en la insignia", () => {
    render(
      <OrderStatusSince
        order={{ status: "PREPARING", createdAt, updatedAt }}
      />,
    );

    expect(since()).toHaveTextContent("En preparación");
  });

  /* 11 de los 12 pedidos reales están así: nadie los ha tocado. Repetir la fecha de creación con
     otro nombre al lado de la insignia es justo lo que confundía. */
  it("un pedido que nunca se movió no pinta nada", () => {
    render(
      <OrderStatusSince
        order={{ status: "PENDING", createdAt, updatedAt: createdAt }}
      />,
    );

    expect(since()).not.toBeInTheDocument();
  });

  it("en inglés lo dice en inglés", () => {
    render(
      <OrderStatusSince
        order={{ status: "DELIVERED", createdAt, updatedAt }}
      />,
      { locale: "en" },
    );

    expect(since()).toHaveTextContent("Delivered on");
  });
});
