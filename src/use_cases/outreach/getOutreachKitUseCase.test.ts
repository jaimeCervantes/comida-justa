import { describe, expect, it } from "vitest";
import {
  grupo,
  LOCALES,
  masaMadreWorld,
  pan,
} from "./__fakes__/masaMadreWorld";
import GetOutreachKitUseCase from "./getOutreachKitUseCase";

/** Martes 13 de octubre, 18:00 en México: la hora con la que se cuentan «hoy» y los turnos. */
const CLOCK = {
  now: new Date("2026-10-13T18:00:00-06:00"),
  timeZone: "America/Mexico_City",
};
const RHYTHM = { dailyLimit: 10, pauseMinutes: 10 };
const DAY = 86_400_000;

function daysAgo(days: number): Date {
  return new Date(CLOCK.now.getTime() - days * DAY);
}

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

    const view = await useCase.execute(textId, LOCALES, CLOCK, RHYTHM);

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

    expect(
      (await useCase.execute(textId, LOCALES, CLOCK, RHYTHM))?.kit.text,
    ).toContain("🌾 Natural — $100");
  });

  it("lo que se agotó sale del texto y se avisa", async () => {
    const { catalog, textId, useCase } = await setup();
    catalog.set("pan-canela", {
      ...pan("pan-canela", "Pan de masa madre de canela", 125),
      stockQuantity: 0,
      isAvailable: false,
    });

    const view = await useCase.execute(textId, LOCALES, CLOCK, RHYTHM);

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

    const view = await useCase.execute(textId, LOCALES, CLOCK, RHYTHM);

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

      const view = await useCase.execute(textId, LOCALES, CLOCK, RHYTHM);

      expect(view?.postChannels.map(({ channel }) => channel.name)).toEqual([
        "Mamás de Orizaba",
      ]);
      expect(view?.listingChannels.map(({ channel }) => channel.name)).toEqual([
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

      const view = await useCase.execute(textId, LOCALES, CLOCK, RHYTHM);

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

  describe("el ritmo", () => {
    it("el turno cuenta desde lo último que se publicó en el grupo, de cualquier texto", async () => {
      const { channels, publications, textId, useCase } = await setup();
      const mamas = await channels.create(grupo("Mamás de Orizaba", "post"));
      const emprendedores = await channels.create(
        grupo("Emprendedores de Orizaba", "post"),
      );
      // Lo de «Mamás» vino de otro texto: igual cuenta para el turno del grupo.
      publications.recordAt(
        { outreachTextId: "otro-texto", channelId: mamas, postId: null },
        daysAgo(3),
      );
      publications.recordAt(
        { outreachTextId: textId, channelId: emprendedores, postId: null },
        daysAgo(8),
      );

      const view = await useCase.execute(textId, LOCALES, CLOCK, RHYTHM);

      expect(
        view?.postChannels.map(({ channel, turn }) => [channel.name, turn]),
      ).toEqual([
        ["Emprendedores de Orizaba", { due: true }],
        ["Mamás de Orizaba", { due: false, inDays: 4 }],
      ]);
    });

    it("en compraventa sugiere el pan que lleva más tiempo sin publicarse ahí", async () => {
      const { channels, publications, textId, useCase } = await setup();
      const compraventa = await channels.create(
        grupo("Compra Venta Orizaba", "listing"),
      );
      publications.recordAt(
        {
          outreachTextId: textId,
          channelId: compraventa,
          postId: "pan-natural",
        },
        daysAgo(2),
      );

      const view = await useCase.execute(textId, LOCALES, CLOCK, RHYTHM);

      expect(view?.listingChannels[0]?.suggestion).toEqual({
        postId: "pan-canela",
        title: "Pan de masa madre de canela",
      });
    });

    it("sugiere una pausa contando desde lo último marcado en cualquier grupo", async () => {
      const { channels, publications, textId, useCase } = await setup();
      const mamas = await channels.create(grupo("Mamás de Orizaba", "post"));
      const compraventa = await channels.create(
        grupo("Compra Venta Orizaba", "listing"),
      );
      publications.recordAt(
        { outreachTextId: textId, channelId: mamas, postId: null },
        daysAgo(1),
      );
      // Lo más reciente fue en otro grupo, hace 4 minutos: de ahí cuenta la pausa.
      publications.recordAt(
        { outreachTextId: "otro-texto", channelId: compraventa, postId: null },
        new Date(CLOCK.now.getTime() - 4 * 60_000),
      );

      const view = await useCase.execute(textId, LOCALES, CLOCK, RHYTHM);

      expect(view?.pause).toEqual({
        waiting: true,
        minutesSince: 4,
        minutesLeft: 6,
      });
    });

    it("el tope y la pausa son los que diga la configuración", async () => {
      const { channels, publications, textId, useCase } = await setup();
      const mamas = await channels.create(grupo("Mamás de Orizaba", "post"));
      publications.recordAt(
        { outreachTextId: textId, channelId: mamas, postId: null },
        CLOCK.now,
      );

      const view = await useCase.execute(textId, LOCALES, CLOCK, {
        dailyLimit: 1,
        pauseMinutes: 0,
      });

      expect(view?.pace).toEqual({ count: 1, limit: 1, reached: true });
      expect(view?.pause).toEqual({ waiting: false });
    });

    it("cuenta lo de hoy en hora de México, y avisa al llegar al tope", async () => {
      const { channels, publications, textId, useCase } = await setup();
      const mamas = await channels.create(grupo("Mamás de Orizaba", "post"));
      const hoy = { outreachTextId: textId, channelId: mamas, postId: null };
      for (let i = 0; i < 10; i++) publications.recordAt(hoy, daysAgo(0));
      // Las 23:50 del lunes en México: ayer, aunque en UTC ya sea martes.
      publications.recordAt(hoy, new Date("2026-10-12T23:50:00-06:00"));

      const view = await useCase.execute(textId, LOCALES, CLOCK, RHYTHM);

      expect(view?.pace).toEqual({ count: 10, limit: 10, reached: true });
    });
  });

  it("un texto que no existe no tiene kit", async () => {
    const { useCase } = await setup();

    expect(
      await useCase.execute("texto-inexistente", LOCALES, CLOCK, RHYTHM),
    ).toBeNull();
  });
});
