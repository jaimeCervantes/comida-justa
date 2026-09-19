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
    expect([...OPEN_STATUSES]).toEqual([
      "PENDING",
      "CONFIRMED",
      "PAID",
      "PREPARING",
      "SHIPPED",
    ]);
  });

  /* Hoy coincide letra por letra con `!isFinal` —`PAID` dejó de ser el contraejemplo el día que
     ganó su propia transición—, y es tentador "simplificar" derivándolo. No se puede: `DRAFT`
     tampoco tiene salidas y aun así no es un pedido abierto, porque no es un pedido. La lista sigue
     curada a mano, y este test es lo que avisa el día que un estado deje de coincidir. */
  it("hoy coincide con !isFinal, pero sigue declarado a mano y no derivado", () => {
    const noFinales = ORDER_STATUSES.filter((status) => !isFinal(status));

    expect([...noFinales]).toEqual([...OPEN_STATUSES]);
    expect(isFinal("DRAFT")).toBe(true);
    expect(OPEN_STATUSES).not.toContain("DRAFT");
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
    ["open", ["PENDING", "CONFIRMED", "PAID", "PREPARING", "SHIPPED"]],
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
