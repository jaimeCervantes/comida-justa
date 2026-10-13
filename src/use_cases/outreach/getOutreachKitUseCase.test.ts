import { describe, expect, it } from "vitest";
import {
  grupo,
  LOCALES,
  masaMadreWorld,
  pan,
} from "./__fakes__/masaMadreWorld";
import GetOutreachKitUseCase from "./getOutreachKitUseCase";

async function setup(now?: () => Date) {
  const world = await masaMadreWorld(now);
  const useCase = new GetOutreachKitUseCase(
    world.texts,
    world.channels,
    world.publications,
  );

  return { ...world, useCase };
}

describe("GetOutreachKitUseCase", () => {
  it("arma el texto con la lista de lo que hay", async () => {
    const { textId, useCase } = await setup();

    const view = await useCase.execute(textId, LOCALES);

    expect(view?.text.name).toBe("Masa madre");
    expect(view?.kit.text).toBe(
      "Pasa por el tuyo a Hazlo Sano:\n🌾 Natural — $96\nCanela — $125",
    );
  });

  // La promesa que justifica generar la lista en vez de guardarla escrita.
  it("un precio nuevo llega solo, sin tocar el texto", async () => {
    const { catalog, textId, useCase } = await setup();
    catalog.set(
      "pan-natural",
      pan("pan-natural", "Pan de Masa Madre Natural", 100),
    );

    expect((await useCase.execute(textId, LOCALES))?.kit.text).toContain(
      "🌾 Natural — $100",
    );
  });

  it("lo que se agotó sale del texto y se avisa", async () => {
    const { catalog, textId, useCase } = await setup();
    catalog.set("pan-canela", {
      ...pan("pan-canela", "Pan de masa madre de canela", 125),
      stockQuantity: 0,
      isAvailable: false,
    });

    const view = await useCase.execute(textId, LOCALES);

    expect(view?.kit.text).not.toContain("Canela");
    expect(view?.kit.excluded).toEqual([
      expect.objectContaining({ label: "Canela", reason: "out-of-stock" }),
    ]);
  });

  it("ofrece un artículo de compraventa por pan disponible, con sus fotos", async () => {
    const { catalog, textId, useCase } = await setup();
    catalog.set("pan-canela", {
      ...pan("pan-canela", "Pan de masa madre de canela", 125),
      stockQuantity: 0,
      isAvailable: false,
    });

    const view = await useCase.execute(textId, LOCALES);

    expect(view?.articles).toEqual([
      expect.objectContaining({
        postId: "pan-natural",
        title: "Pan de Masa Madre Natural",
        price: "96",
        photos: [
          {
            url: "https://fotos.example/pan-natural.jpg",
            alt: "Pan de Masa Madre Natural",
          },
        ],
      }),
    ]);
  });

  describe("los grupos", () => {
    it("el tipo decide dónde aparece cada uno", async () => {
      const { channels, textId, useCase } = await setup();
      await channels.create(grupo("Mamás de Orizaba", "post"));
      await channels.create(grupo("Compra Venta Orizaba", "listing"));

      const view = await useCase.execute(textId, LOCALES);

      expect(view?.postChannels.map(({ channel }) => channel.name)).toEqual([
        "Mamás de Orizaba",
      ]);
      expect(view?.listingChannels.map((channel) => channel.name)).toEqual([
        "Compra Venta Orizaba",
      ]);
      expect(
        view?.articles[0]?.channels.map(({ channel }) => channel.name),
      ).toEqual(["Compra Venta Orizaba"]);
    });

    it("cada grupo dice la última vez que recibió esto, y nulo si nunca", async () => {
      const monday = new Date("2026-10-12T16:00:00Z");
      const { channels, publications, textId, useCase } = await setup(
        () => monday,
      );
      const mamas = await channels.create(grupo("Mamás de Orizaba", "post"));
      await channels.create(grupo("Emprendedores de Orizaba", "post"));
      const compraventa = await channels.create(
        grupo("Compra Venta Orizaba", "listing"),
      );
      await publications.record([
        { outreachTextId: textId, channelId: mamas, postId: null },
        {
          outreachTextId: textId,
          channelId: compraventa,
          postId: "pan-natural",
        },
      ]);

      const view = await useCase.execute(textId, LOCALES);

      expect(
        view?.postChannels.map(({ channel, lastPublishedAt }) => [
          channel.name,
          lastPublishedAt,
        ]),
      ).toEqual([
        ["Emprendedores de Orizaba", null],
        ["Mamás de Orizaba", monday],
      ]);
      expect(
        view?.articles.map((article) => [
          article.postId,
          article.channels[0]?.lastPublishedAt,
        ]),
      ).toEqual([
        ["pan-natural", monday],
        ["pan-canela", null],
      ]);
    });
  });

  it("un texto que no existe no tiene kit", async () => {
    const { useCase } = await setup();

    expect(await useCase.execute("texto-inexistente", LOCALES)).toBeNull();
  });
});
