import { describe, expect, it } from "vitest";
import {
  ASSUMED_COURIER_SPEED_KMH,
  canShareDeliveryLocation,
  type DeliveryProgressInput,
  deliveryProgress,
  etaMinutes,
} from "./delivery";
import type { OrderStatus } from "./order";

/* Posiciones reales de Mérida: el repartidor saliendo del centro, el destino en García Ginerés. */
const courierLocation = {
  lat: 20.9674,
  lng: -89.6237,
  updatedAt: new Date("2026-09-26T18:00:00Z"),
};
const deliveryLocation = {
  lat: 20.9801,
  lng: -89.6352,
  updatedAt: new Date("2026-09-26T17:40:00Z"),
};

function shipped(
  overrides: Partial<DeliveryProgressInput> = {},
): DeliveryProgressInput {
  return {
    status: "SHIPPED",
    courierLocation,
    deliveryLocation,
    courierDistanceMeters: 1850,
    ...overrides,
  };
}

/* La corrida de escritorio de `orders.feature` (@slice-14 @component): hace falta el destino Y la
   posición del repartidor; con una sola no hay distancia que enseñar. */
describe("deliveryProgress: de qué depende que se pueda mostrar distancia", () => {
  it.each([
    ["guardado", "en camino", true, "están las dos posiciones"],
    ["(ninguno)", "en camino", false, "falta el destino"],
    ["guardado", "(ninguno)", false, "falta la posición del repartidor"],
    ["(ninguno)", "(ninguno)", false, "no hay ninguna de las dos"],
  ] as const)(
    "destino %s, repartidor %s → %s (%s)",
    (destino, repartidor, shown) => {
      const order = shipped({
        deliveryLocation: destino === "guardado" ? deliveryLocation : null,
        courierLocation: repartidor === "en camino" ? courierLocation : null,
        /* La base solo calcula distancia cuando están los dos puntos. */
        courierDistanceMeters:
          destino === "guardado" && repartidor === "en camino" ? 1850 : null,
      });

      expect(deliveryProgress(order) !== null).toBe(shown);
    },
  );

  it("da la distancia que calculó la base y un tiempo estimado", () => {
    expect(deliveryProgress(shipped())).toEqual({
      distanceMeters: 1850,
      etaMinutes: etaMinutes(1850),
    });
  });

  it.each([
    "PENDING",
    "CONFIRMED",
    "PAID",
    "PREPARING",
    "DELIVERED",
    "CANCELLED",
  ] as OrderStatus[])(
    "fuera de Enviado (%s) no hay distancia, aunque queden las dos posiciones",
    (status) => {
      expect(deliveryProgress(shipped({ status }))).toBeNull();
    },
  );

  it("sin cifra de la base no inventa una, aunque estén los dos puntos", () => {
    expect(
      deliveryProgress(shipped({ courierDistanceMeters: null })),
    ).toBeNull();
  });
});

describe("etaMinutes", () => {
  const metersPerMinute = (ASSUMED_COURIER_SPEED_KMH * 1000) / 60;

  it.each([
    [0, 1, "ya está encima: nunca «0 min»"],
    [1, 1, "un metro sigue siendo al menos un minuto"],
    [metersPerMinute, 1, "justo un minuto a la velocidad asumida"],
    [metersPerMinute + 1, 2, "se redondea hacia arriba: mejor llegar antes"],
    [metersPerMinute * 10, 10, "diez minutos exactos"],
  ])("%d m → %d min (%s)", (meters, expected) => {
    expect(etaMinutes(meters)).toBe(expected);
  });
});

/* Compartir el destino se puede en cualquier momento mientras el pedido siga abierto — no solo
   Enviado —, pero no cuando ya llegó o se canceló: ahí no queda entrega a la que apuntar. */
describe("canShareDeliveryLocation", () => {
  it.each([
    ["PENDING", true],
    ["CONFIRMED", true],
    ["PAID", true],
    ["PREPARING", true],
    ["SHIPPED", true],
    ["DELIVERED", false],
    ["CANCELLED", false],
    ["DRAFT", false],
  ] as Array<[OrderStatus, boolean]>)("%s: %s", (status, expected) => {
    expect(canShareDeliveryLocation(status)).toBe(expected);
  });
});
