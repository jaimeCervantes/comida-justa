import { describe, expect, it } from "vitest";
import {
  hasOutreachTextErrors,
  normalizeOutreachTextDraft,
  type OutreachTextDraft,
  validateOutreachTextDraft,
} from "./outreachTextDraft";

function draft(
  name: string,
  label: string,
  overrides: Partial<OutreachTextDraft> = {},
): OutreachTextDraft {
  return {
    name,
    opening: "",
    closing: "",
    items: [{ postId: "pan-natural", label, emoji: null }],
    ...overrides,
  };
}

describe("lo que falta se rechaza sin guardar nada", () => {
  it.each([
    { nombre: "Masa madre", etiqueta: "Natural", errores: {} },
    { nombre: "", etiqueta: "Natural", errores: { name: "required" } },
    {
      nombre: "Masa madre",
      etiqueta: "",
      errores: { items: { 0: { label: "required" } } },
    },
  ])(
    'nombre "$nombre", etiqueta "$etiqueta"',
    ({ nombre, etiqueta, errores }) => {
      expect(validateOutreachTextDraft(draft(nombre, etiqueta))).toEqual(
        errores,
      );
    },
  );

  it("un nombre de puros espacios cuenta como vacío", () => {
    expect(validateOutreachTextDraft(draft("   ", "Natural"))).toEqual({
      name: "required",
    });
  });

  it("señala cada etiqueta vacía en su lugar, y todo a la vez", () => {
    const errors = validateOutreachTextDraft(
      draft("", "", {
        items: [
          { postId: "a", label: "Natural", emoji: null },
          { postId: "b", label: " ", emoji: null },
          { postId: "c", label: "", emoji: null },
        ],
      }),
    );

    expect(errors).toEqual({
      name: "required",
      items: { 1: { label: "required" }, 2: { label: "required" } },
    });
    expect(hasOutreachTextErrors(errors)).toBe(true);
  });

  it("un texto sin productos sí se puede guardar", () => {
    expect(
      hasOutreachTextErrors(
        validateOutreachTextDraft(draft("Masa madre", "", { items: [] })),
      ),
    ).toBe(false);
  });
});

describe("el borrador se guarda limpio", () => {
  it("recorta, normaliza los saltos de renglón y vacía los emojis en blanco", () => {
    expect(
      normalizeOutreachTextDraft({
        name: "  Masa madre ",
        opening: "Hay pan:\r\n",
        closing: "\r\nPedidos\r\npor WhatsApp",
        items: [{ postId: "a", label: " Natural ", emoji: "  " }],
      }),
    ).toEqual({
      name: "Masa madre",
      opening: "Hay pan:",
      closing: "Pedidos\npor WhatsApp",
      items: [{ postId: "a", label: "Natural", emoji: null }],
    });
  });

  it("un mismo producto dos veces se queda con el primero", () => {
    const { items } = normalizeOutreachTextDraft(
      draft("Masa madre", "Natural", {
        items: [
          { postId: "a", label: "Natural", emoji: "🌾" },
          { postId: "a", label: "Otra vez", emoji: null },
        ],
      }),
    );

    expect(items).toEqual([{ postId: "a", label: "Natural", emoji: "🌾" }]);
  });
});
