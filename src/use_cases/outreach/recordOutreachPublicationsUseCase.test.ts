import { describe, expect, it } from "vitest";
import { grupo, LOCALES, masaMadreWorld } from "./__fakes__/masaMadreWorld";
import RecordOutreachPublicationsUseCase from "./recordOutreachPublicationsUseCase";

async function setup() {
  const world = await masaMadreWorld();
  const mamas = await world.channels.create(grupo("Mamás de Orizaba", "post"));
  const emprendedores = await world.channels.create(
    grupo("Emprendedores de Orizaba", "post"),
  );
  const compraventa = await world.channels.create(
    grupo("Compra Venta Orizaba", "listing"),
  );
  const cordoba = await world.channels.create(
    grupo("Vendo y Compro Córdoba", "listing"),
  );
  const useCase = new RecordOutreachPublicationsUseCase(
    world.texts,
    world.channels,
    world.publications,
  );

  return {
    ...world,
    ids: { mamas, emprendedores, compraventa, cordoba },
    useCase,
  };
}

describe("RecordOutreachPublicationsUseCase", () => {
  it("marca la línea entera en varios grupos normales de una vez", async () => {
    const { ids, publications, textId, useCase } = await setup();

    const result = await useCase.execute({
      outreachTextId: textId,
      channelIds: [ids.mamas, ids.emprendedores],
      postId: null,
      locales: LOCALES,
    });

    expect(result).toEqual({ status: "recorded", count: 2 });
    expect(
      publications.recorded.map(({ channelId, postId }) => ({
        channelId,
        postId,
      })),
    ).toEqual([
      { channelId: ids.mamas, postId: null },
      { channelId: ids.emprendedores, postId: null },
    ]);
  });

  it("marca un pan suelto en los grupos de compraventa que se eligieron", async () => {
    const { ids, publications, textId, useCase } = await setup();

    await useCase.execute({
      outreachTextId: textId,
      channelIds: [ids.compraventa, ids.cordoba],
      postId: "pan-natural",
      locales: LOCALES,
    });

    expect(publications.recorded.map(({ postId }) => postId)).toEqual([
      "pan-natural",
      "pan-natural",
    ]);
  });

  it("sin grupos marcados no escribe nada", async () => {
    const { publications, textId, useCase } = await setup();

    expect(
      await useCase.execute({
        outreachTextId: textId,
        channelIds: [],
        postId: null,
        locales: LOCALES,
      }),
    ).toEqual({ status: "nothing-selected" });
    expect(publications.recorded).toEqual([]);
  });

  it("un grupo marcado dos veces cuenta una", async () => {
    const { ids, textId, useCase } = await setup();

    expect(
      await useCase.execute({
        outreachTextId: textId,
        channelIds: [ids.mamas, ids.mamas],
        postId: null,
        locales: LOCALES,
      }),
    ).toEqual({ status: "recorded", count: 1 });
  });

  // Mezclar los dos formatos sería un historial que miente. Solo llega armado a mano.
  it.each([
    ["la línea entera en un grupo de compraventa", "compraventa", null],
    ["un pan suelto en un grupo normal", "mamas", "pan-natural"],
    ["un pan que no es de este texto", "compraventa", "jugo-verde"],
    ["un grupo que no existe", "inexistente", null],
  ] as const)("rechaza %s", async (_caso, grupoId, postId) => {
    const { ids, publications, textId, useCase } = await setup();
    const channelId =
      grupoId === "inexistente" ? "grupo-inexistente" : ids[grupoId];

    expect(
      await useCase.execute({
        outreachTextId: textId,
        channelIds: [channelId],
        postId,
        locales: LOCALES,
      }),
    ).toEqual({ status: "invalid" });
    expect(publications.recorded).toEqual([]);
  });

  it("un texto que no existe no se marca", async () => {
    const { ids, useCase } = await setup();

    expect(
      await useCase.execute({
        outreachTextId: "texto-borrado",
        channelIds: [ids.mamas],
        postId: null,
        locales: LOCALES,
      }),
    ).toEqual({ status: "not-found" });
  });
});
