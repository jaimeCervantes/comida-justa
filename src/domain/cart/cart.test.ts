import { describe, expect, it } from "vitest";
import {
  buildCartLines,
  type CartProduct,
  type CartSeller,
  groupBySeller,
} from "./cart";

/* Datos reales del catálogo (2026-08-09): "Jugo Verde" a 40 y "Suero natural" a 35, los dos de
   Hazlo Sano, que es hoy la única tienda. */
const hazloSano: CartSeller = {
  id: "05bea858-88d0-4ff3-a531-3d82a7ad6fcc",
  name: "Hazlo Sano",
  handle: "hazlo-sano",
  phone: "2781126948",
};

/* La segunda tienda NO existe en la base. Es la que sostiene el modelo: un carrito se parte en un
   pedido por vendedor, y eso tiene que estar probado antes de que llegue el segundo vendedor, no
   después. Ver "El carrito es de varios vendedores" en docs/features/pedidos.md. */
const panaderiaLaLuz: CartSeller = {
  id: "8f2c1d4e-0000-4000-8000-000000000002",
  name: "Panadería La Luz",
  handle: "panaderia-la-luz",
  phone: "2789990011",
};

const jugoVerde: CartProduct = {
  postId: "f5258215-a56c-4c86-813e-89177f2860d2",
  title: "Jugo Verde",
  slug: "jugo-verde",
  price: 40,
  isAvailable: true,
  imageUrl: null,
  seller: hazloSano,
};

const sueroNatural: CartProduct = {
  postId: "4e256323-9965-5f82-a8d6-6fc2849e9c77",
  title: "Suero natural",
  slug: "suero-natural",
  price: 35,
  isAvailable: true,
  imageUrl: null,
  seller: hazloSano,
};

const panDeCampo: CartProduct = {
  postId: "8f2c1d4e-0000-4000-8000-000000000010",
  title: "Pan de campo",
  slug: "pan-de-campo",
  price: 60,
  isAvailable: true,
  imageUrl: null,
  seller: panaderiaLaLuz,
};

describe("buildCartLines", () => {
  it("cruza lo que el navegador recuerda con el precio de hoy", () => {
    const lines = buildCartLines(
      [
        { postId: jugoVerde.postId, quantity: 2 },
        { postId: sueroNatural.postId, quantity: 1 },
      ],
      [jugoVerde, sueroNatural],
    );

    expect(lines).toHaveLength(2);
    expect(lines[0].amount).toBe(80);
    expect(lines[1].amount).toBe(35);
  });

  it("conserva lo agotado, pero sin cobrarlo", () => {
    const lines = buildCartLines(
      [{ postId: sueroNatural.postId, quantity: 3 }],
      [{ ...sueroNatural, isAvailable: false }],
    );

    // Sigue a la vista —quien lo puso tiene derecho a enterarse— y no suma nada.
    expect(lines).toHaveLength(1);
    expect(lines[0].amount).toBe(0);
  });

  it("deja caer un id que ya no corresponde a ningún producto", () => {
    const lines = buildCartLines(
      [
        { postId: jugoVerde.postId, quantity: 1 },
        { postId: "borrado-o-nunca-existió", quantity: 1 },
      ],
      [jugoVerde],
    );

    expect(lines).toHaveLength(1);
    expect(lines[0].product.title).toBe("Jugo Verde");
  });

  it("respeta el orden del carrito, no el de la consulta", () => {
    const lines = buildCartLines(
      [
        { postId: sueroNatural.postId, quantity: 1 },
        { postId: jugoVerde.postId, quantity: 1 },
      ],
      // La base devuelve lo que quiera: quien manda es la selección.
      [jugoVerde, sueroNatural],
    );

    expect(lines.map((line) => line.product.title)).toEqual([
      "Suero natural",
      "Jugo Verde",
    ]);
  });
});

describe("groupBySeller", () => {
  it("con una sola tienda devuelve un grupo con su total", () => {
    const lines = buildCartLines(
      [
        { postId: jugoVerde.postId, quantity: 2 },
        { postId: sueroNatural.postId, quantity: 1 },
      ],
      [jugoVerde, sueroNatural],
    );

    const groups = groupBySeller(lines);

    expect(groups).toHaveLength(1);
    expect(groups[0].seller.name).toBe("Hazlo Sano");
    expect(groups[0].subtotal).toBe(115);
  });

  /* El escenario "Dos tiendas se cobran y se piden por separado" de orders.feature. Es de Vitest y
     no de Playwright porque hoy la base tiene un solo vendedor. */
  it("parte el carrito en un pedido por tienda, cada uno con su subtotal", () => {
    const lines = buildCartLines(
      [
        { postId: jugoVerde.postId, quantity: 1 },
        { postId: panDeCampo.postId, quantity: 2 },
        { postId: sueroNatural.postId, quantity: 1 },
      ],
      [jugoVerde, panDeCampo, sueroNatural],
    );

    const groups = groupBySeller(lines);

    expect(groups).toHaveLength(2);
    expect(groups[0].seller.name).toBe("Hazlo Sano");
    expect(groups[0].lines).toHaveLength(2);
    expect(groups[0].subtotal).toBe(75);
    expect(groups[1].seller.name).toBe("Panadería La Luz");
    expect(groups[1].subtotal).toBe(120);
  });

  it("ordena los grupos por aparición, para que la lista no se reordene sola", () => {
    const lines = buildCartLines(
      [
        { postId: panDeCampo.postId, quantity: 1 },
        { postId: jugoVerde.postId, quantity: 1 },
      ],
      [jugoVerde, panDeCampo],
    );

    expect(groupBySeller(lines).map((group) => group.seller.name)).toEqual([
      "Panadería La Luz",
      "Hazlo Sano",
    ]);
  });

  it("un grupo entero agotado existe, y su subtotal es cero", () => {
    const lines = buildCartLines(
      [{ postId: jugoVerde.postId, quantity: 1 }],
      [{ ...jugoVerde, isAvailable: false }],
    );

    const groups = groupBySeller(lines);

    // No se borra: la pantalla tiene que poder decir por qué no se puede pedir.
    expect(groups).toHaveLength(1);
    expect(groups[0].subtotal).toBe(0);
  });

  it("un carrito vacío no inventa grupos", () => {
    expect(groupBySeller([])).toEqual([]);
  });
});
