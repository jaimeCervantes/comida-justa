import { describe, expect, it } from "vitest";
import { measuredFrom } from "./measuredFrom";

describe("measuredFrom", () => {
  /* Lo único que se le pide: que dos puntos distintos no compartan identidad. */
  it("distingue dos sitios distintos", () => {
    expect(measuredFrom({ latitude: 18.6, longitude: -96.68 })).not.toBe(
      measuredFrom({ latitude: 18.96, longitude: -96.68 }),
    );
  });

  /*
   * Y lo contrario, que es lo que protege al lector: con la misma ubicación el valor no cambia, así
   * que una revalidación por cualquier otro motivo no le tira las páginas que llevaba cargadas.
   */
  it("y no se mueve mientras la ubicación sea la misma", () => {
    expect(measuredFrom({ latitude: 18.6, longitude: -96.68 })).toBe(
      measuredFrom({ latitude: 18.6, longitude: -96.68 }),
    );
  });

  it("sin ubicación devuelve algo estable, no una cadena vacía", () => {
    expect(measuredFrom(null)).toBe("unknown");
  });

  /* Es el paso que de verdad ocurre: se entra sin cookie y el refrescador la escribe al montar. */
  it("y pasar de no saber a saber cuenta como cambio", () => {
    expect(measuredFrom(null)).not.toBe(
      measuredFrom({ latitude: 18.6, longitude: -96.68 }),
    );
  });
});
