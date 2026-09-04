import { describe, expect, it } from "vitest";
import { resolveInventoryScope } from "./inventoryScope";

describe("resolveInventoryScope", () => {
  it.each([
    ["out", "out"],
    ["untracked", "untracked"],
    ["all", "all"],
  ])("reconoce %j", (raw, expected) => {
    expect(resolveInventoryScope(raw)).toBe(expected);
  });

  /* Un parámetro inventado es alguien que editó la URL o un enlace viejo, no un error que merezca
     una pantalla: se le enseña el inventario completo, que es lo más parecido a lo que quería. */
  it.each([
    ["agotados", "una etiqueta traducida en vez de la clave"],
    ["", "un parámetro vacío"],
    [undefined, "un parámetro ausente"],
    [["out"], "un parámetro repetido, que Next entrega como lista"],
  ])("cae a todos con %j: %s", (raw, _motivo) => {
    expect(resolveInventoryScope(raw)).toBe("all");
  });
});
