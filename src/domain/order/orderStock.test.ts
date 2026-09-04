import { describe, expect, it } from "vitest";
import type { OrderStatus } from "./order";
import { type StockDemand, shortfalls, stockEffectOf } from "./orderStock";

describe("stockEffectOf", () => {
  /* La corrida de escritorio del `.feature`: las seis transiciones que el dominio permite, y qué le
     hace cada una al inventario. */
  it.each<[OrderStatus, OrderStatus, string]>([
    ["PENDING", "CONFIRMED", "reserve"],
    ["PENDING", "CANCELLED", "none"],
    ["CONFIRMED", "PREPARING", "none"],
    ["CONFIRMED", "CANCELLED", "release"],
    ["PREPARING", "DELIVERED", "none"],
    ["PREPARING", "CANCELLED", "release"],
  ])("de %s a %s: %s", (from, to, expected) => {
    expect(stockEffectOf(from, to)).toBe(expected);
  });

  /* Aceptar es el único momento que compromete mercancía, y sólo ocurre una vez: de CONFIRMED no se
     vuelve a PENDING, así que no hay forma de descontar dos veces el mismo pedido. */
  it("preparar y entregar no vuelven a descontar", () => {
    expect(stockEffectOf("CONFIRMED", "PREPARING")).toBe("none");
    expect(stockEffectOf("PREPARING", "DELIVERED")).toBe("none");
  });
});

const dona: StockDemand = {
  postId: "post-dona",
  title: "Dona Chocolate Keto",
  quantity: 2,
};

describe("shortfalls", () => {
  it("no falta nada cuando hay de sobra", () => {
    expect(shortfalls([dona], { "post-dona": 12 })).toEqual([]);
  });

  it("no falta nada cuando queda justo", () => {
    expect(shortfalls([dona], { "post-dona": 2 })).toEqual([]);
  });

  it("falta lo que no alcanza", () => {
    expect(shortfalls([dona], { "post-dona": 1 })).toEqual([dona]);
  });

  it("un producto agotado no puede servir nada", () => {
    expect(shortfalls([dona], { "post-dona": 0 })).toEqual([dona]);
  });

  /* La garantía de que esto no toca a las 418 publicaciones que no llevan la cuenta: sin inventario
     no hay nada que pueda faltar, y el pedido se acepta igual que siempre. */
  it("lo que no lleva inventario nunca falta", () => {
    expect(shortfalls([dona], { "post-dona": null })).toEqual([]);
    expect(shortfalls([dona], {})).toEqual([]);
  });

  it("señala solo los renglones que no se pueden servir", () => {
    const jugo: StockDemand = {
      postId: "post-jugo",
      title: "Jugo Verde",
      quantity: 1,
    };

    expect(
      shortfalls([dona, jugo], { "post-dona": 1, "post-jugo": 5 }),
    ).toEqual([dona]);
  });

  /* Un renglón cuya publicación se borró conserva su título y su precio —para eso se congelaron—
     pero ya no apunta a ningún inventario que mover. */
  it("un renglón sin publicación no falta ni descuenta", () => {
    expect(
      shortfalls([{ postId: null, title: "Pan de ayer", quantity: 3 }], {}),
    ).toEqual([]);
  });
});
