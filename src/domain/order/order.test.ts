import { describe, expect, it } from "vitest";
import {
  canTransition,
  INITIAL_STATUS,
  isFinal,
  lineAmount,
  nextStatuses,
  ORDER_STATUSES,
  type OrderLine,
  type OrderStatus,
  orderTotal,
} from "./order";

/* Datos reales del catálogo: "Jugo Verde" a 40 y "Suero natural" a 35. */
const jugoVerde: OrderLine = {
  postId: "f5258215-a56c-4c86-813e-89177f2860d2",
  title: "Jugo Verde",
  unitPrice: 40,
  quantity: 2,
};

const sueroNatural: OrderLine = {
  postId: "4e256323-9965-5f82-a8d6-6fc2849e9c77",
  title: "Suero natural",
  unitPrice: 35,
  quantity: 1,
};

describe("los estados", () => {
  it("son los siete del enum que ya existe en la base", () => {
    // Si alguien añade uno aquí sin migrar el enum, la escritura falla en producción y no en un test.
    expect([...ORDER_STATUSES]).toEqual([
      "DRAFT",
      "PENDING",
      "CONFIRMED",
      "PAID",
      "PREPARING",
      "DELIVERED",
      "CANCELLED",
    ]);
  });

  it("un pedido nace pendiente, que es lo que el vendedor todavía no ha visto", () => {
    expect(INITIAL_STATUS).toBe("PENDING");
  });
});

describe("canTransition", () => {
  /* Corrida de escritorio del flujo del vendedor. La columna `razón` no la consume nadie: está para
     que se entienda por qué cada fila existe. */
  it.each([
    ["PENDING", "CONFIRMED", true, "el vendedor lo acepta"],
    ["PENDING", "CANCELLED", true, "se arrepiente o no puede"],
    ["CONFIRMED", "PREPARING", true, "se pone a ello"],
    ["PREPARING", "DELIVERED", true, "lo entrega"],
    ["PREPARING", "CANCELLED", true, "se le acabó a media preparación"],
    ["PENDING", "DELIVERED", false, "no se entrega lo que no se aceptó"],
    [
      "PENDING",
      "PREPARING",
      false,
      "saltarse la aceptación esconde el paso que decide",
    ],
    ["CONFIRMED", "PENDING", false, "no hay marcha atrás: nadie des-acepta"],
    [
      "DELIVERED",
      "CANCELLED",
      false,
      "lo entregado no se deshace cambiando una fila",
    ],
    ["CANCELLED", "CONFIRMED", false, "un pedido cancelado no revive"],
    ["DELIVERED", "PREPARING", false, "tampoco se vuelve atrás desde el final"],
  ] as Array<[OrderStatus, OrderStatus, boolean, string]>)(
    "de %s a %s: %s (%s)",
    (from, to, expected) => {
      expect(canTransition(from, to)).toBe(expected);
    },
  );

  it("desde PENDING solo se puede aceptar o cancelar", () => {
    expect([...nextStatuses("PENDING")]).toEqual(["CONFIRMED", "CANCELLED"]);
  });
});

describe("isFinal", () => {
  it.each([
    ["DELIVERED", true],
    ["CANCELLED", true],
    ["PENDING", false],
    ["CONFIRMED", false],
    ["PREPARING", false],
  ] as Array<[OrderStatus, boolean]>)("%s es final: %s", (status, expected) => {
    expect(isFinal(status)).toBe(expected);
  });

  /* `PAID` y `DRAFT` no tienen salidas todavía, así que hoy `isFinal` dice que sí. No es un
     descuido: es la consecuencia honesta de que ningún pedido puede llegar a ellos aún. Cuando el
     pago exista, PAID gana su salida hacia PREPARING y este test cambia con él. */
  it.each([["DRAFT"], ["PAID"]] as Array<[OrderStatus]>)(
    "%s todavía no participa del flujo",
    (status) => {
      expect(nextStatuses(status)).toEqual([]);
    },
  );
});

describe("orderTotal", () => {
  it("suma cantidad por precio congelado", () => {
    expect(orderTotal([jugoVerde, sueroNatural])).toBe(115);
  });

  it("un pedido sin renglones no debe nada", () => {
    expect(orderTotal([])).toBe(0);
  });

  it("el importe de un renglón es su precio por su cantidad", () => {
    expect(lineAmount(jugoVerde)).toBe(80);
  });

  /* El precio del renglón es una copia, no una referencia: subir el precio de la publicación no
     puede mover el total de un pedido ya hecho. Aquí se comprueba lo único comprobable en el
     dominio —que el total sale del renglón y no de ninguna otra parte—; que la copia se haga al
     crear el pedido lo prueba el caso de uso. */
  it("el total sale de los renglones y de nada más", () => {
    const subido = { ...jugoVerde, unitPrice: 999 };

    expect(orderTotal([subido])).toBe(1998);
  });
});
