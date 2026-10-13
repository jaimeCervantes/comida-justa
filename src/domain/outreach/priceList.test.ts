import { describe, expect, it } from "vitest";
import { addedInOrder, listedProduct } from "./__fixtures__/listedProduct";
import { buildPriceList, decideListing, formatListPrice } from "./priceList";

/**
 * Las corridas de escritorio del `.feature` (`src/e2e/outreach/difusionEnGrupos.feature`, slice 1):
 * cada `Examples` es una tabla de este archivo.
 */
describe("la lista de precios de un texto de difusión", () => {
  describe("cada pan sale en la lista o queda fuera con su motivo", () => {
    it.each([
      {
        etiqueta: "Natural",
        estado: "publicado, con 2 existencias",
        producto: { price: 96, stockQuantity: 2 },
        resultado: { listed: true, price: 96 },
      },
      {
        etiqueta: "Semillas",
        estado: "publicado, sin inventario y disponible",
        producto: { price: 125, stockQuantity: null, isAvailable: true },
        resultado: { listed: true, price: 125 },
      },
      {
        etiqueta: "Canela",
        estado: "publicado, con 0 existencias",
        producto: { price: 125, stockQuantity: 0, isAvailable: false },
        resultado: { listed: false, reason: "out-of-stock" },
      },
      {
        etiqueta: "Hierbas finas",
        estado: "publicado, sin inventario y apagado a mano",
        producto: { price: 125, stockQuantity: null, isAvailable: false },
        resultado: { listed: false, reason: "unavailable" },
      },
      {
        etiqueta: "Integral",
        estado: "publicado, con 3 existencias",
        producto: { price: null, stockQuantity: 3 },
        resultado: { listed: false, reason: "no-price" },
      },
      {
        etiqueta: "Chocolate",
        estado: "en revisión, con 5 existencias",
        producto: { price: 136, moderationStatus: "in_review" },
        resultado: { listed: false, reason: "not-published" },
      },
    ])("$etiqueta ($estado)", ({ etiqueta, producto, resultado }) => {
      expect(
        decideListing(listedProduct({ label: etiqueta, ...producto })),
      ).toEqual(resultado);
    });

    it("lo que queda fuera se avisa con su etiqueta y nunca llega a la lista", () => {
      const { lines, excluded } = buildPriceList(
        addedInOrder([
          { label: "Natural", price: 96 },
          { label: "Canela", price: 125, stockQuantity: 0, isAvailable: false },
        ]),
      );

      expect(lines).toEqual(["Natural — $96"]);
      expect(excluded).toEqual([
        expect.objectContaining({ label: "Canela", reason: "out-of-stock" }),
      ]);
    });

    /* Un pan en revisión que además se agotó sigue sin poder anunciarse aunque se reponga: el aviso
       tiene que decir la causa que lo destraba. */
    it("cuando aplican dos motivos, gana el que hay que arreglar primero", () => {
      expect(
        decideListing(
          listedProduct({
            moderationStatus: "rejected",
            stockQuantity: 0,
            isAvailable: false,
            price: null,
          }),
        ),
      ).toEqual({ listed: false, reason: "not-published" });
    });

    // Nulo no es cero: sin inventario manda el interruptor manual, como en el resto del sitio.
    it("un pan sin inventario no se da por agotado", () => {
      expect(
        decideListing(
          listedProduct({ stockQuantity: null, isAvailable: true }),
        ),
      ).toEqual({ listed: true, price: 96 });
    });
  });

  describe("los del mismo precio comparten renglón y los renglones van del más barato al más caro", () => {
    it.each([
      {
        porQue: "el mismo precio comparte renglón",
        agregados: [
          { label: "Natural", emoji: "🌾", price: 96 },
          { label: "Semillas", emoji: "🌻", price: 125 },
          { label: "Canela", price: 125 },
        ],
        lista: ["🌾 Natural — $96", "🌻 Semillas / Canela — $125"],
      },
      {
        porQue: "del más barato al más caro, no por orden",
        agregados: [
          { label: "Chocolate", emoji: "🍫", price: 136 },
          { label: "Natural", emoji: "🌾", price: 96 },
        ],
        lista: ["🌾 Natural — $96", "🍫 Chocolate — $136"],
      },
      {
        porQue: "el renglón lleva el primer emoji que aparezca",
        agregados: [
          { label: "Canela", price: 125 },
          { label: "Semillas", emoji: "🌻", price: 125 },
        ],
        lista: ["🌻 Canela / Semillas — $125"],
      },
      {
        porQue: "los emojis de los demás no se repiten",
        agregados: [
          { label: "Semillas", emoji: "🌻", price: 125 },
          { label: "Arándanos", emoji: "🫐", price: 125 },
        ],
        lista: ["🌻 Semillas / Arándanos — $125"],
      },
    ])("$porQue", ({ agregados, lista }) => {
      expect(buildPriceList(addedInOrder(agregados)).lines).toEqual(lista);
    });

    it("dentro de un renglón manda el orden en que se agregaron, no el de llegada", () => {
      const [semillas, canela] = addedInOrder([
        { label: "Semillas", price: 125 },
        { label: "Canela", price: 125 },
      ]);

      expect(buildPriceList([canela, semillas]).lines).toEqual([
        "Semillas / Canela — $125",
      ]);
    });

    // El texto de un formulario trae espacios de más; el renglón no debe heredarlos.
    it("la etiqueta y el emoji se leen sin los espacios con que se escribieron", () => {
      expect(
        buildPriceList([
          listedProduct({ label: "  Natural ", emoji: " 🌾 ", price: 96 }),
        ]).lines,
      ).toEqual(["🌾 Natural — $96"]);
    });

    it("sin nada disponible no hay renglones", () => {
      expect(
        buildPriceList(
          addedInOrder([
            { label: "Natural", stockQuantity: 0, isAvailable: false },
          ]),
        ).lines,
      ).toEqual([]);
    });
  });

  describe("el precio se escribe como en un letrero", () => {
    it.each([
      { precio: 96, seLee: "$96" },
      { precio: 140.0, seLee: "$140" },
      { precio: 96.5, seLee: "$96.50" },
      { precio: 1250, seLee: "$1,250" },
    ])("$precio se lee $seLee", ({ precio, seLee }) => {
      expect(formatListPrice(precio)).toBe(seLee);
      expect(
        buildPriceList([listedProduct({ label: "Natural", price: precio })])
          .lines[0],
      ).toMatch(new RegExp(`— \\${seLee}$`));
    });
  });
});
