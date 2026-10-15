import { describe, expect, it } from "vitest";
import { grupo, masaMadreWorld } from "./__fakes__/masaMadreWorld";
import DeleteOutreachRecordUseCase from "./deleteOutreachRecordUseCase";

describe("DeleteOutreachRecordUseCase", () => {
  it("borra un texto y deja de existir", async () => {
    const { texts, textId } = await masaMadreWorld();

    expect(
      await new DeleteOutreachRecordUseCase(texts).execute(textId),
    ).toEqual({
      status: "deleted",
    });
    expect(await texts.findById(textId)).toBeNull();
  });

  it("borra un grupo", async () => {
    const { channels } = await masaMadreWorld();
    const id = await channels.create(grupo("Mamás de Orizaba", "post"));

    await new DeleteOutreachRecordUseCase(channels).execute(id);

    expect(await channels.list()).toEqual([]);
  });

  it("borra un pie", async () => {
    const { footers } = await masaMadreWorld();
    const id = await footers.create({ name: "Hazlo Sano", body: "📲 Pedidos" });

    await new DeleteOutreachRecordUseCase(footers).execute(id);

    expect(await footers.findById(id)).toBeNull();
  });

  // Lo borró otra persona entre que se abrió la pantalla y se confirmó.
  it("avisa si ya no existía", async () => {
    const { channels } = await masaMadreWorld();

    expect(
      await new DeleteOutreachRecordUseCase(channels).execute("grupo-borrado"),
    ).toEqual({ status: "not-found" });
  });
});
