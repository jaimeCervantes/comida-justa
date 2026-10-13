import type { OutreachChannelInput } from "~/domain/outreach/outreachChannelDraft";
import InMemoryOutreachChannelRepository from "./InMemoryOutreachChannelRepository";
import InMemoryOutreachPublicationRepository from "./InMemoryOutreachPublicationRepository";
import InMemoryOutreachTextRepository, {
  type CatalogProduct,
} from "./InMemoryOutreachTextRepository";

export const LOCALES = { locale: "es", fallbackLocale: "es" };

export function pan(
  postId: string,
  title: string,
  price: number,
): CatalogProduct {
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

export function grupo(
  name: string,
  format: OutreachChannelInput["format"],
): OutreachChannelInput {
  return {
    name,
    url: `https://www.facebook.com/groups/${name.toLowerCase().replaceAll(" ", "")}`,
    format,
    minDaysBetween: 7,
    notes: "",
  };
}

/**
 * Los tres repositorios sin base, con el texto «Masa madre» de dos panes ya guardado: el mundo
 * mínimo en que se pueden contar todas las historias de la difusión.
 *
 * `now` es la hora que la prueba controla para el historial, como la pondría el `DEFAULT now()`.
 */
export async function masaMadreWorld(now: () => Date = () => new Date()) {
  const catalog = new Map<string, CatalogProduct>([
    ["pan-natural", pan("pan-natural", "Pan de Masa Madre Natural", 96)],
    ["pan-canela", pan("pan-canela", "Pan de masa madre de canela", 125)],
  ]);
  const texts = new InMemoryOutreachTextRepository(catalog);
  const channels = new InMemoryOutreachChannelRepository();
  const publications = new InMemoryOutreachPublicationRepository(now, (id) =>
    (texts.saved.get(id)?.items ?? []).map((item) => item.postId),
  );
  const textId = await texts.create({
    name: "Masa madre",
    opening: "Pasa por el tuyo a Hazlo Sano:",
    closing: "",
    items: [
      { postId: "pan-natural", label: "Natural", emoji: "🌾" },
      { postId: "pan-canela", label: "Canela", emoji: null },
    ],
  });

  return { catalog, texts, channels, publications, textId };
}
