import { describe, expect, it } from "vitest";
import { LIST_TERM_MAX_LENGTH, normalizeListTerm } from "./listTerm";

describe("normalizeListTerm", () => {
  it("quita los espacios de los lados, que no son término", () => {
    expect(normalizeListTerm("  masa madre  ")).toBe("masa madre");
  });

  it("no toca los de en medio: son parte de lo que se busca", () => {
    expect(normalizeListTerm("masa  madre")).toBe("masa  madre");
  });

  /* Vacío es **no filtrar**, no buscar la cadena vacía: quien lo recibe se salta el `WHERE`. */
  it.each([
    ["", "ya venía vacío"],
    ["   ", "sólo espacios"],
    [undefined, "no venía en la dirección"],
    [null, "llegó nulo"],
    [["masa"], "Next entrega una lista cuando el parámetro se repite"],
    [42, "no es texto"],
  ])("cae a vacío con %j: %s", (raw) => {
    expect(normalizeListTerm(raw)).toBe("");
  });

  it("recorta al tope del dominio, no al del campo", () => {
    expect(normalizeListTerm("a".repeat(500))).toHaveLength(
      LIST_TERM_MAX_LENGTH,
    );
  });

  /* El recorte va **después** del `trim`: si no, ochenta espacios seguidos de una palabra dejarían
     el término vacío después de limpiarlo. */
  it("primero limpia y luego recorta", () => {
    expect(normalizeListTerm(`${" ".repeat(100)}pan`)).toBe("pan");
  });
});
