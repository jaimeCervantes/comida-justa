import { describe, expect, it } from "vitest";
import { parseCheckoutId } from "./checkoutCookie";

const CHECKOUT = "11111111-2222-3333-4444-555555555555";

describe("parseCheckoutId", () => {
  /* Corrida de escritorio del Scenario Outline "Una cookie de checkout manipulada no rompe el
     pedido" en orders.feature. El valor va a una columna `uuid`: lo que no lo sea reventaría el
     INSERT justo en el momento de comprar. */
  it.each([
    [CHECKOUT, CHECKOUT, "el caso normal"],
    [
      "11111111222233334444555555555555",
      null,
      "sin guiones no es un uuid para Postgres",
    ],
    ["' OR 1=1 --", null, "una cookie la escribe cualquiera"],
    [`${CHECKOUT} `, null, "con un espacio de más tampoco"],
    [`${CHECKOUT}${CHECKOUT}`, null, "dos uuids pegados no son uno"],
    ["", null, "todavía no hay compra empezada"],
  ] as Array<[string, string | null, string]>)(
    "con %j devuelve %j (%s)",
    (cookie, expected) => {
      expect(parseCheckoutId(cookie)).toBe(expected);
    },
  );

  it.each([null, undefined])("sin cookie (%j) no hay compra", (raw) => {
    expect(parseCheckoutId(raw)).toBeNull();
  });

  it("acepta el uuid que genera el navegador, en mayúsculas o en minúsculas", () => {
    const generated = crypto.randomUUID();

    expect(parseCheckoutId(generated)).toBe(generated);
    expect(parseCheckoutId(generated.toUpperCase())).toBe(
      generated.toUpperCase(),
    );
  });
});
