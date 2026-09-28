import { describe, expect, it } from "vitest";
import {
  ASSUMED_COURIER_SPEED_KMH,
  COURIER_LOCATION_STALE_AFTER_MS,
  canShareDeliveryLocation,
  type DeliveryProgressInput,
  deliveryProgress,
  etaMinutes,
  isCourierLocationStale,
  staleMinutes,
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

/* Un turno normal de envío después de la última posición: fresca. */
const NOW = new Date(courierLocation.updatedAt.getTime() + 15_000);

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

      expect(deliveryProgress(order, NOW) !== null).toBe(shown);
    },
  );

  it("da la distancia que calculó la base y un tiempo estimado", () => {
    expect(deliveryProgress(shipped(), NOW)).toEqual({
      distanceMeters: 1850,
      etaMinutes: etaMinutes(1850),
      staleMinutes: null,
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
      expect(deliveryProgress(shipped({ status }), NOW)).toBeNull();
    },
  );

  it("sin cifra de la base no inventa una, aunque estén los dos puntos", () => {
    expect(
      deliveryProgress(shipped({ courierDistanceMeters: null }), NOW),
    ).toBeNull();
  });
});

/* La corrida de escritorio de `orders.feature` (@slice-15 @component): a partir de 2 min —ocho
   envíos perdidos seguidos— la posición ya no es un tropiezo de red, se detuvo. */
describe("isCourierLocationStale", () => {
  it.each([
    ["15 s", 15_000, false, "es el turno normal de envío"],
    ["1 min 59 s", 119_000, false, "todavía cabe en un tropiezo de red"],
    ["2 min", 120_000, true, "ocho envíos perdidos seguidos: se detuvo"],
    ["30 min", 30 * 60_000, true, "lleva rato sin moverse en la pantalla"],
  ] as const)("hace %s → vieja: %s (%s)", (_, ageMs, stale) => {
    const updatedAt = new Date("2026-09-28T18:00:00Z");
    const now = new Date(updatedAt.getTime() + ageMs);

    expect(isCourierLocationStale(updatedAt, now)).toBe(stale);
  });

  it("el umbral es de dos minutos", () => {
    expect(COURIER_LOCATION_STALE_AFTER_MS).toBe(120_000);
  });

  /* Un reloj del servidor por detrás del de quien escribió no vuelve vieja una posición recién
     llegada. */
  it("una posición «del futuro» no está vieja", () => {
    const updatedAt = new Date("2026-09-28T18:00:10Z");

    expect(
      isCourierLocationStale(updatedAt, new Date("2026-09-28T18:00:00Z")),
    ).toBe(false);
  });
});

describe("staleMinutes", () => {
  const updatedAt = new Date("2026-09-28T18:00:00Z");

  it("fresca: null, no hay nada que advertir", () => {
    expect(
      staleMinutes(updatedAt, new Date("2026-09-28T18:01:00Z")),
    ).toBeNull();
  });

  it("vieja: los minutos enteros que lleva sin moverse", () => {
    expect(staleMinutes(updatedAt, new Date("2026-09-28T18:07:40Z"))).toBe(7);
  });
});

/* Con la posición vieja, la distancia sigue siendo un dato —dicho en pasado— pero el tiempo estimado
   no: estimar desde un punto viejo es inventar. */
describe("deliveryProgress con la posición vieja", () => {
  it("da la distancia y cuánto hace, sin tiempo estimado", () => {
    const sevenMinutesLater = new Date(
      courierLocation.updatedAt.getTime() + 7 * 60_000,
    );

    expect(deliveryProgress(shipped(), sevenMinutesLater)).toEqual({
      distanceMeters: 1850,
      etaMinutes: null,
      staleMinutes: 7,
    });
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
