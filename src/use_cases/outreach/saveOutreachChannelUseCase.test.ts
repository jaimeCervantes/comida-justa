import { describe, expect, it } from "vitest";
import type { OutreachChannelDraft } from "~/domain/outreach/outreachChannelDraft";
import InMemoryOutreachChannelRepository from "./__fakes__/InMemoryOutreachChannelRepository";
import SaveOutreachChannelUseCase from "./saveOutreachChannelUseCase";

const COMPRA_VENTA: OutreachChannelDraft = {
  name: " Compra Venta Orizaba ",
  url: "facebook.com/groups/compraventaorizaba",
  format: "listing",
  minDaysBetween: "7",
  notes: "Solo los sábados, con foto y precio",
};

function setup() {
  const channels = new InMemoryOutreachChannelRepository();

  return { channels, useCase: new SaveOutreachChannelUseCase(channels) };
}

describe("SaveOutreachChannelUseCase", () => {
  it("da de alta el grupo ya limpio", async () => {
    const { channels, useCase } = setup();

    const result = await useCase.execute({ draft: COMPRA_VENTA });

    expect(result.status).toBe("saved");
    if (result.status !== "saved") return;
    expect(channels.saved.get(result.id)).toEqual({
      name: "Compra Venta Orizaba",
      url: "https://facebook.com/groups/compraventaorizaba",
      format: "listing",
      minDaysBetween: 7,
      notes: "Solo los sábados, con foto y precio",
    });
  });

  it("con identidad corrige el que ya existe", async () => {
    const { channels, useCase } = setup();
    const created = await useCase.execute({ draft: COMPRA_VENTA });
    if (created.status !== "saved") throw new Error("no se guardó");

    await useCase.execute({
      id: created.id,
      draft: { ...COMPRA_VENTA, minDaysBetween: "3" },
    });

    expect(channels.saved.get(created.id)?.minDaysBetween).toBe(3);
  });

  it("no guarda nada si algo falta, y dice qué", async () => {
    const { channels, useCase } = setup();

    expect(
      await useCase.execute({
        draft: { ...COMPRA_VENTA, url: "compra venta" },
      }),
    ).toEqual({ status: "invalid", errors: { url: "invalid" } });
    expect(channels.saved.size).toBe(0);
  });

  it("avisa si el grupo que se corregía ya no existe", async () => {
    const { useCase } = setup();

    expect(
      await useCase.execute({ id: "grupo-borrado", draft: COMPRA_VENTA }),
    ).toEqual({ status: "not-found" });
  });
});
