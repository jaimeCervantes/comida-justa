import { describe, expect, it } from "vitest";
import type { OutreachTextDraft } from "~/domain/outreach/outreachTextDraft";
import InMemoryOutreachTextRepository from "./__fakes__/InMemoryOutreachTextRepository";
import SaveOutreachTextUseCase from "./saveOutreachTextUseCase";

const MASA_MADRE: OutreachTextDraft = {
  name: " Masa madre ",
  opening: "Pasa por el tuyo a Hazlo Sano:\r\n",
  closing: "📲 Pedidos WhatsApp: https://wa.me/522781126948",
  items: [
    { postId: "pan-natural", label: "Natural", emoji: "🌾" },
    { postId: "pan-semillas", label: "Semillas", emoji: "" },
  ],
};

function setup() {
  const repository = new InMemoryOutreachTextRepository();

  return { repository, useCase: new SaveOutreachTextUseCase(repository) };
}

describe("SaveOutreachTextUseCase", () => {
  it("crea el texto ya limpio y devuelve su identidad", async () => {
    const { repository, useCase } = setup();

    const result = await useCase.execute({ draft: MASA_MADRE });

    expect(result.status).toBe("saved");
    if (result.status !== "saved") return;
    expect(repository.saved.get(result.id)).toEqual({
      name: "Masa madre",
      opening: "Pasa por el tuyo a Hazlo Sano:",
      closing: "📲 Pedidos WhatsApp: https://wa.me/522781126948",
      items: [
        { postId: "pan-natural", label: "Natural", emoji: "🌾" },
        { postId: "pan-semillas", label: "Semillas", emoji: null },
      ],
    });
  });

  it("con identidad reemplaza el que ya existe", async () => {
    const { repository, useCase } = setup();
    const id = await repository.create(MASA_MADRE);

    const result = await useCase.execute({
      id,
      draft: {
        ...MASA_MADRE,
        items: [{ postId: "pan-chocolate", label: "Chocolate", emoji: "🍫" }],
      },
    });

    expect(result).toEqual({ status: "saved", id });
    expect(repository.saved.get(id)?.items).toEqual([
      { postId: "pan-chocolate", label: "Chocolate", emoji: "🍫" },
    ]);
  });

  it("no guarda nada si falta el nombre o una etiqueta, y dice dónde", async () => {
    const { repository, useCase } = setup();

    const result = await useCase.execute({
      draft: {
        ...MASA_MADRE,
        name: "",
        items: [
          { postId: "pan-natural", label: "Natural", emoji: null },
          { postId: "pan-semillas", label: "  ", emoji: null },
        ],
      },
    });

    expect(result).toEqual({
      status: "invalid",
      errors: { name: "required", items: { 1: { label: "required" } } },
    });
    expect(repository.saved.size).toBe(0);
  });

  // Lo borró otra persona entre que se abrió el formulario y se guardó.
  it("avisa si el texto que se quería reemplazar ya no existe", async () => {
    const { useCase } = setup();

    expect(
      await useCase.execute({ id: "texto-borrado", draft: MASA_MADRE }),
    ).toEqual({ status: "not-found" });
  });
});
