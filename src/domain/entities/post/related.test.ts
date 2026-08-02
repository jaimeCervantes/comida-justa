import { describe, expect, it } from "vitest";
import { pickRelated } from "./related";

/** Los vecinos reales de "Jugo Verde" según el vector, en su orden. */
const vecinos = [
  { id: "suero", kind: "producto", isAvailable: true },
  { id: "agua-pina", kind: "producto", isAvailable: true },
  { id: "agua-avena", kind: "producto", isAvailable: true },
  { id: "electrolitos", kind: "producto", isAvailable: true },
  { id: "verduras", kind: "anuncio", isAvailable: true },
];

describe("pickRelated", () => {
  it("respeta el orden de parecido que trae la consulta", () => {
    expect(
      pickRelated(vecinos, "jugo-verde", 3).map((post) => post.id),
    ).toEqual(["suero", "agua-pina", "agua-avena"]);
  });

  it("no se recomienda a sí misma", () => {
    const conSigoMisma = [{ id: "jugo-verde", kind: "producto" }, ...vecinos];

    expect(pickRelated(conSigoMisma, "jugo-verde", 4)).not.toContainEqual(
      expect.objectContaining({ id: "jugo-verde" }),
    );
  });

  it("no ofrece un producto agotado", () => {
    const conAgotado = [
      { id: "suero", kind: "producto", isAvailable: false },
      ...vecinos.slice(1),
    ];

    // El suero cae y su plaza la ocupa el siguiente vecino, no queda un hueco.
    expect(pickRelated(conAgotado, "jugo-verde", 4).map((p) => p.id)).toEqual([
      "agua-pina",
      "agua-avena",
      "electrolitos",
      "verduras",
    ]);
  });

  it("sigue ofreciendo un anuncio, que no se agota aunque diga que no está disponible", () => {
    const anuncio = [{ id: "verduras", kind: "anuncio", isAvailable: false }];

    expect(pickRelated(anuncio, "jugo-verde", 4)).toHaveLength(1);
  });

  it("devuelve como mucho el límite pedido, y nada con límite cero", () => {
    expect(pickRelated(vecinos, "jugo-verde", 2)).toHaveLength(2);
    expect(pickRelated(vecinos, "jugo-verde", 0)).toHaveLength(0);
  });

  it("aguanta que la base no devuelva vecinos", () => {
    expect(pickRelated([], "jugo-verde", 4)).toEqual([]);
  });
});
