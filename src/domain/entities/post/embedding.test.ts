import { describe, it, expect } from "vitest";
import {
  EMBEDDING_DIMENSIONS,
  buildEmbeddingText,
  hasEmbeddableText,
  hasExpectedDimensions,
} from "./embedding";

describe("buildEmbeddingText", () => {
  // Corrida de escritorio contra `_build_embedding_text` del backend Python: si esta cadena
  // cambia, lo publicado desde el sitio deja de leerse igual que el catálogo ya indexado.
  it("reproduces the document the chatbot used to index the legacy catalog", () => {
    const text = buildEmbeddingText({
      title: "Jugo Verde",
      category: "Alimentación",
      subCategory: "Jugos",
      content: "Espinaca, apio, pepino y limón. Sin azúcar añadida.",
      tags: ["jugo", "detox"],
      price: 40,
    });

    expect(text).toBe(
      [
        "Nombre: Jugo Verde",
        "Categoría: Alimentación",
        "Sub-categoría: Jugos",
        "Descripción: Espinaca, apio, pepino y limón. Sin azúcar añadida.",
        "Etiquetas: jugo, detox",
        "Precio: $40.00",
      ].join("\n"),
    );
  });

  describe.each([
    [
      "sin categoría ni sub-categoría",
      { title: "Suero natural", content: "Agua, limón y sal de mar", price: 35 },
      "Nombre: Suero natural\nDescripción: Agua, limón y sal de mar\nPrecio: $35.00",
    ],
    [
      "sin precio",
      { title: "Aviso de temporada", content: "Cerramos el lunes" },
      "Nombre: Aviso de temporada\nDescripción: Cerramos el lunes",
    ],
    [
      "solo título",
      { title: "Pan de masa madre" },
      "Nombre: Pan de masa madre",
    ],
    [
      "descripción en blanco se omite en vez de escribirse vacía",
      { title: "Miel de abeja", content: "   " },
      "Nombre: Miel de abeja",
    ],
  ])("%s", (_case, source, expected) => {
    it("omits the missing fields", () => {
      expect(buildEmbeddingText(source)).toBe(expected);
    });
  });

  it("cleans the double quotes the legacy catalog left inside tags", () => {
    const text = buildEmbeddingText({
      title: "Omelet con ensalada",
      tags: ['"omelet"', ' "desayuno" ', "", '""'],
    });

    expect(text).toBe("Nombre: Omelet con ensalada\nEtiquetas: omelet, desayuno");
  });

  it("keeps two decimals so 20 and 20.5 read the same way", () => {
    expect(buildEmbeddingText({ title: "Agua", price: 20 })).toContain("Precio: $20.00");
    expect(buildEmbeddingText({ title: "Agua", price: 20.5 })).toContain("Precio: $20.50");
  });
});

describe("hasEmbeddableText", () => {
  it.each([
    [{ title: "Jugo Verde" }, true],
    [{ title: "", content: "Espinaca y apio" }, true],
    [{ title: "   ", content: "  " }, false],
    [{ title: "" }, false],
  ])("%j is %s", (source, expected) => {
    expect(hasEmbeddableText(source)).toBe(expected);
  });
});

describe("hasExpectedDimensions", () => {
  it("accepts exactly the dimensions the column declares", () => {
    expect(hasExpectedDimensions(new Array(EMBEDDING_DIMENSIONS).fill(0.1))).toBe(true);
  });

  it.each([
    ["too short", new Array(EMBEDDING_DIMENSIONS - 1).fill(0.1)],
    ["too long", new Array(EMBEDDING_DIMENSIONS + 1).fill(0.1)],
    ["empty", []],
    ["with NaN", [...new Array(EMBEDDING_DIMENSIONS - 1).fill(0.1), Number.NaN]],
  ])("rejects a vector %s", (_case, embedding) => {
    expect(hasExpectedDimensions(embedding)).toBe(false);
  });

  it("pins the dimension the chatbot's catalog already uses", () => {
    expect(EMBEDDING_DIMENSIONS).toBe(768);
  });
});
