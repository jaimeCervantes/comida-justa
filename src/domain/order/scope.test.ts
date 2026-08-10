import { describe, expect, it } from "vitest";
import {
  CLOSED_STATUSES,
  isFinal,
  OPEN_STATUSES,
  ORDER_STATUSES,
  type OrderStatus,
  resolveScope,
  statusesInScope,
} from "./order";

describe("los ámbitos de la lista", () => {
  it("abiertos son los que piden acción, y solo esos", () => {
    expect([...OPEN_STATUSES]).toEqual(["PENDING", "CONFIRMED", "PREPARING"]);
  });

  /* `DRAFT` y `PAID` tampoco tienen salidas hoy, así que `isFinal` dice que sí para los dos — pero
     NO son pedidos abiertos ni terminados del sitio: uno es del carrito del bot y el otro espera al
     pago en línea. Este test existe para que enumerarlos no parezca redundante y alguien los
     "simplifique" derivándolos de `isFinal`. */
  it("no se derivan de isFinal, aunque se le parezca", () => {
    const noFinales = ORDER_STATUSES.filter((status) => !isFinal(status));

    expect([...noFinales]).toEqual([...OPEN_STATUSES]);
    expect(isFinal("DRAFT")).toBe(true);
    expect(isFinal("PAID")).toBe(true);
    expect(OPEN_STATUSES).not.toContain("DRAFT");
    expect(CLOSED_STATUSES).not.toContain("PAID");
  });

  it("abiertos y terminados no se solapan", () => {
    const solapados = OPEN_STATUSES.filter((status) =>
      CLOSED_STATUSES.includes(status),
    );

    expect(solapados).toEqual([]);
  });
});

describe("statusesInScope", () => {
  it.each([
    ["open", ["PENDING", "CONFIRMED", "PREPARING"]],
    ["closed", ["DELIVERED", "CANCELLED"]],
  ] as Array<["open" | "closed", OrderStatus[]]>)(
    "%s filtra a %j",
    (scope, expected) => {
      expect([...statusesInScope(scope)]).toEqual(expected);
    },
  );

  it("«todos» no filtra nada, ni siquiera lo que el sitio no produce", () => {
    expect([...statusesInScope("all")]).toEqual([...ORDER_STATUSES]);
  });
});

describe("resolveScope", () => {
  /* Llega de la URL, así que puede ser cualquier cosa. Por omisión, lo abierto: quien entra viene a
     atender lo que espera, no a repasar lo entregado. */
  it.each([
    ["closed", "closed"],
    ["all", "all"],
    ["open", "open"],
    ["inventado", "open"],
    ["", "open"],
    [undefined, "open"],
  ])("con %j devuelve %s", (candidate, expected) => {
    expect(resolveScope(candidate)).toBe(expected);
  });
});
