import { describe, expect, it } from "vitest";
import {
  canNotifySeller,
  canTransition,
  checkoutTotal,
  closedAt,
  type Elapsed,
  elapsedBetween,
  INITIAL_STATUS,
  isFinal,
  lineAmount,
  nextStatuses,
  ORDER_STATUSES,
  type OrderLine,
  type OrderStatus,
  orderItemCount,
  orderTotal,
} from "./order";

/* Datos reales del catálogo: "Jugo Verde" a 40 y "Suero natural" a 35. */
const jugoVerde: OrderLine = {
  postId: "f5258215-a56c-4c86-813e-89177f2860d2",
  title: "Jugo Verde",
  unitPrice: 40,
  quantity: 2,
  slug: "jugo-verde",
  imageUrl: null,
};

const sueroNatural: OrderLine = {
  postId: "4e256323-9965-5f82-a8d6-6fc2849e9c77",
  title: "Suero natural",
  unitPrice: 35,
  quantity: 1,
  slug: "suero-natural",
  imageUrl: null,
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

/* La corrida de escritorio de `orders.feature` (@slice-7). Se avisa mientras el pedido siga ABIERTO,
   no sólo cuando esté pendiente: la puerta la cierra que el pedido deje de moverse. */
describe("canNotifySeller", () => {
  it.each([
    [
      "PENDING",
      true,
      "el vendedor ni siquiera lo ha visto — es el caso de hoy",
    ],
    ["CONFIRMED", true, "ya lo vio, pero el pedido sigue vivo"],
    ["PREPARING", true, "lo mismo: alguien espera al otro lado"],
    ["DELIVERED", false, "ya está en manos del cliente"],
    ["CANCELLED", false, "el pedido dejó de moverse"],
    ["DRAFT", false, "no existe como pedido: el borrador es el carrito"],
    ["PAID", false, "no participa todavía; cuando el pago exista se decide"],
  ] as Array<[OrderStatus, boolean, string]>)(
    "%s: %s (%s)",
    (status, expected) => {
      expect(canNotifySeller(status)).toBe(expected);
    },
  );

  /* No se deriva de `isFinal` aunque hoy coincidan en cinco de siete: `DRAFT` y `PAID` son finales
     por no tener salidas y aun así no se avisan. Si mañana `PAID` gana su transición, `isFinal`
     dejaría de decir que no — y este test es lo que obliga a decidirlo a mano. */
  it("no es lo contrario de isFinal: DRAFT y PAID no son finales por el mismo motivo", () => {
    expect(canNotifySeller("PAID")).toBe(false);
    expect(isFinal("PAID")).toBe(true);
  });
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

describe("checkoutTotal", () => {
  /* Lo que costó la compra entera cuando el carrito se partió en dos tiendas. No es cobrable —cada
     tienda cobra la suya— pero es lo que se gastó, que es lo que se mira al volver al pedido. */
  it("suma los pedidos hermanos de una misma compra", () => {
    expect(
      checkoutTotal([{ lines: [jugoVerde] }, { lines: [sueroNatural] }]),
    ).toBe(115);
  });

  it("con un solo pedido es su total", () => {
    expect(checkoutTotal([{ lines: [jugoVerde, sueroNatural] }])).toBe(
      orderTotal([jugoVerde, sueroNatural]),
    );
  });

  it("sin pedidos no inventa un importe", () => {
    expect(checkoutTotal([])).toBe(0);
  });
});

/* La corrida de escritorio de `orders.feature` (@slice-6). Se cuentan CANTIDADES, no renglones: el
   pedido real del 14 de agosto tiene 3 filas en la tabla y 9 cosas que preparar. */
describe("orderItemCount", () => {
  const pechugaNaranja: OrderLine = {
    postId: "d4e1a70e-9f43-4b25-9a0c-3c9e2a0b1f11",
    title: "Pechuga de pollo a la naranja en bistec",
    unitPrice: 105,
    quantity: 1,
    slug: "pechuga-de-pollo-a-la-naranja-en-bistec",
    imageUrl: null,
  };

  it("suma las cantidades, no los renglones", () => {
    const seisSueros = { ...sueroNatural, quantity: 6 };
    const dosAsadas = { ...pechugaNaranja, title: "asada", quantity: 2 };

    expect(orderItemCount([pechugaNaranja, dosAsadas, seisSueros])).toBe(9);
  });

  it("dos renglones de uno son dos artículos", () => {
    expect(orderItemCount([sueroNatural, pechugaNaranja])).toBe(2);
  });

  it("un pedido sin renglones no lleva nada", () => {
    expect(orderItemCount([])).toBe(0);
  });
});

/* La corrida de escritorio de `orders.feature` (@slice-8). El pedido real del 10 de agosto tardó
   1 h 27 min de punta a punta, y ese tramo es justo lo que hasta ahora no se podía leer. */
describe("elapsedBetween", () => {
  const alas = (hhmm: string) => new Date(`2026-08-10T${hhmm}:00Z`);

  it.each([
    ["01:58", "03:25", { unit: "hours", hours: 1, minutes: 27 }],
    ["01:58", "02:14", { unit: "minutes", minutes: 16 }],
    ["01:58", "02:58", { unit: "hours", hours: 1, minutes: 0 }],
    ["01:58", "01:58", { unit: "minutes", minutes: 0 }],
  ] as Array<[string, string, Elapsed]>)("de %s a %s", (from, to, expected) => {
    expect(elapsedBetween(alas(from), alas(to))).toEqual(expected);
  });

  it("a partir de un día se cuenta en días y los minutos dejan de importar", () => {
    expect(
      elapsedBetween(alas("01:58"), new Date("2026-08-13T01:58:00Z")),
    ).toEqual({ unit: "days", days: 3 });
  });

  /* Dos filas escritas en el mismo milisegundo, o un reloj torcido, no pueden producir "-3 min". */
  it("nunca da un tiempo negativo", () => {
    expect(elapsedBetween(alas("03:25"), alas("01:58"))).toEqual({
      unit: "minutes",
      minutes: 0,
    });
  });
});

describe("closedAt", () => {
  const updatedAt = new Date("2026-08-10T03:25:39.277Z");

  it.each([
    ["DELIVERED", true, "el estado final ES la entrega"],
    ["CANCELLED", true, "también terminó, y también importa cuándo"],
    ["PENDING", false, "no ha pasado ni lo uno ni lo otro"],
    ["PREPARING", false, "está en marcha, no terminado"],
  ] as Array<[OrderStatus, boolean, string]>)(
    "%s: %s (%s)",
    (status, expected) => {
      const result = closedAt({ status, updatedAt });

      expect(result === null).toBe(!expected);
    },
  );

  /* `isFinal` diría que sí de los dos: hoy no tienen salidas. Pero un pedido pagado no está
     terminado, y uno en borrador tampoco — por eso esto mira `CLOSED_STATUSES`. */
  it.each([["PAID"], ["DRAFT"]] as Array<[OrderStatus]>)(
    "%s no está terminado, aunque no tenga salidas",
    (status) => {
      expect(closedAt({ status, updatedAt })).toBeNull();
    },
  );
});
