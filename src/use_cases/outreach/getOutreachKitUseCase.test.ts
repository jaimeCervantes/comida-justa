import { describe, expect, it } from "vitest";
import InMemoryOutreachTextRepository, {
  type CatalogProduct,
} from "./__fakes__/InMemoryOutreachTextRepository";
import GetOutreachKitUseCase from "./getOutreachKitUseCase";

const LOCALES = { locale: "es", fallbackLocale: "es" };

function pan(postId: string, title: string, price: number): CatalogProduct {
  return {
    postId,
    title,
    kind: "producto",
    price,
    isAvailable: true,
    stockQuantity: 5,
    moderationStatus: "published",
    photos: [{ url: `https://fotos.example/${postId}.jpg`, alt: title }],
  };
}

async function setup() {
  const catalog = new Map<string, CatalogProduct>([
    ["pan-natural", pan("pan-natural", "Pan de Masa Madre Natural", 96)],
    ["pan-canela", pan("pan-canela", "Pan de masa madre de canela", 125)],
  ]);
  const repository = new InMemoryOutreachTextRepository(catalog);
  const id = await repository.create({
    name: "Masa madre",
    opening: "Pasa por el tuyo a Hazlo Sano:",
    closing: "",
    items: [
      { postId: "pan-natural", label: "Natural", emoji: "🌾" },
      { postId: "pan-canela", label: "Canela", emoji: null },
    ],
  });

  return { catalog, id, useCase: new GetOutreachKitUseCase(repository) };
}

describe("GetOutreachKitUseCase", () => {
  it("arma el texto con la lista de lo que hay", async () => {
    const { id, useCase } = await setup();

    const view = await useCase.execute(id, LOCALES);

    expect(view?.text.name).toBe("Masa madre");
    expect(view?.kit.text).toBe(
      "Pasa por el tuyo a Hazlo Sano:\n🌾 Natural — $96\nCanela — $125",
    );
  });

  // La promesa que justifica generar la lista en vez de guardarla escrita.
  it("un precio nuevo llega solo, sin tocar el texto", async () => {
    const { catalog, id, useCase } = await setup();
    catalog.set(
      "pan-natural",
      pan("pan-natural", "Pan de Masa Madre Natural", 100),
    );

    expect((await useCase.execute(id, LOCALES))?.kit.text).toContain(
      "🌾 Natural — $100",
    );
  });

  it("lo que se agotó sale del texto y se avisa", async () => {
    const { catalog, id, useCase } = await setup();
    catalog.set("pan-canela", {
      ...pan("pan-canela", "Pan de masa madre de canela", 125),
      stockQuantity: 0,
      isAvailable: false,
    });

    const view = await useCase.execute(id, LOCALES);

    expect(view?.kit.text).not.toContain("Canela");
    expect(view?.kit.excluded).toEqual([
      expect.objectContaining({ label: "Canela", reason: "out-of-stock" }),
    ]);
  });

  it("ofrece un artículo de compraventa por pan disponible, con sus fotos", async () => {
    const { catalog, id, useCase } = await setup();
    catalog.set("pan-canela", {
      ...pan("pan-canela", "Pan de masa madre de canela", 125),
      stockQuantity: 0,
      isAvailable: false,
    });

    const view = await useCase.execute(id, LOCALES);

    expect(view?.articles).toEqual([
      {
        postId: "pan-natural",
        title: "Pan de Masa Madre Natural",
        price: "96",
        photos: [
          {
            url: "https://fotos.example/pan-natural.jpg",
            alt: "Pan de Masa Madre Natural",
          },
        ],
      },
    ]);
  });

  it("un texto que no existe no tiene kit", async () => {
    const { useCase } = await setup();

    expect(await useCase.execute("texto-inexistente", LOCALES)).toBeNull();
  });
});
