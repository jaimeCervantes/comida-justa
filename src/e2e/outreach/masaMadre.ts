import type { OutreachTextDraft } from "~/domain/outreach/outreachTextDraft";
import { seedOutreachText } from "../testUtils/outreachTexts";
import { seedPost } from "../testUtils/seedPost";
import { seedStock } from "../testUtils/seedStock";
import { testOutreachName, testSlug } from "../testUtils/testSlug";

/**
 * El `Background` de `difusionEnGrupos.feature`: los panes de masa madre con sus precios reales
 * del catálogo, la etiqueta y el emoji que llevan en la publicación, y el texto que los rodea.
 *
 * Los panes reales no se tocan —sus existencias cambian cada día—: se siembran copias dentro de
 * «Hazlo Sano» con el marcador `E2E` en el título, que es también lo que las distingue de las
 * reales en el buscador del formulario.
 */
export const BREADS = [
  {
    key: "natural",
    title: "Pan de Masa Madre Natural",
    price: 96,
    stock: 2,
    label: "Natural",
    emoji: "🌾",
  },
  {
    key: "semillas",
    title: "Pan de Masa Madre con Semillas",
    price: 125,
    stock: 5,
    label: "Semillas",
    emoji: "🌻",
  },
  {
    key: "arandanos",
    title: "Pan de masa madre de arándanos",
    price: 125,
    stock: 5,
    label: "Arándanos",
    emoji: "",
  },
  {
    key: "canela",
    title: "Pan de masa madre de canela",
    price: 125,
    stock: 2,
    label: "Canela",
    emoji: "",
  },
  {
    key: "chocolate",
    title: "Pan de Masa Madre de Chocolate",
    price: 136,
    stock: 5,
    label: "Chocolate Orgánico",
    emoji: "🍫",
  },
] as const;

export type BreadKey = (typeof BREADS)[number]["key"];

export const OPENING = [
  "¿Te inflama el pan comercial? Pásate a la Masa Madre en Hazlo Sano. 📲2781126948",
  "🛒 DISPONIBLES EN TIENDA (1 kg). Pasa por el tuyo a Hazlo Sano:",
].join("\n");

export const CLOSING = "📲 Pedidos WhatsApp: https://wa.me/522781126948";

/** El texto que el escenario principal espera, renglón por renglón. */
export const EXPECTED_TEXT = [
  "¿Te inflama el pan comercial? Pásate a la Masa Madre en Hazlo Sano. 📲2781126948",
  "🛒 DISPONIBLES EN TIENDA (1 kg). Pasa por el tuyo a Hazlo Sano:",
  "",
  "🌾 Natural — $96",
  "🌻 Semillas / Arándanos / Canela — $125",
  "🍫 Chocolate Orgánico — $136",
  "",
  "📲 Pedidos WhatsApp: https://wa.me/522781126948",
].join("\n");

export interface SeededBread {
  key: BreadKey;
  postId: string;
  slug: string;
  /** El título tal como lo ofrece el buscador: con el marcador y único por corrida. */
  title: string;
  label: string;
  emoji: string;
}

const STORE_HANDLE = "hazlo-sano";

/**
 * Siembra los cinco panes y apunta sus slugs en `seeded` para el barrido del `afterEach`, aunque
 * la siembra se corte a la mitad.
 */
export async function seedBreads(seeded: string[]): Promise<SeededBread[]> {
  const breads: SeededBread[] = [];

  for (const bread of BREADS) {
    const slug = testSlug(`masa-madre-${bread.key}`);
    const title = `E2E ${bread.title} ${slug.slice(-6)}`;
    seeded.push(slug);

    const postId = await seedPost({
      title,
      slug,
      kind: "producto",
      origin: "hazlo_sano_propio",
      price: bread.price,
      sellerHandle: STORE_HANDLE,
    });
    await seedStock(slug, bread.stock);

    breads.push({
      key: bread.key,
      postId,
      slug,
      title,
      label: bread.label,
      emoji: bread.emoji,
    });
  }

  return breads;
}

/**
 * «La publicación "Masa madre" ya está guardada». Devuelve su identidad. El nombre se puede fijar
 * cuando el escenario lo afirma; si no, sale de `testOutreachName`, con el marcador del barrido.
 */
export async function seedMasaMadreText(
  breads: readonly SeededBread[],
  name: string = testOutreachName("Masa madre"),
  extras: Pick<OutreachTextDraft, "versions" | "footerId"> = {},
): Promise<string> {
  const draft: OutreachTextDraft = {
    ...extras,
    name,
    opening: OPENING,
    closing: CLOSING,
    items: breads.map((bread) => ({
      postId: bread.postId,
      label: bread.label,
      emoji: bread.emoji || null,
    })),
  };

  return seedOutreachText(draft);
}

export function breadOf(
  breads: readonly SeededBread[],
  key: BreadKey,
): SeededBread {
  const bread = breads.find((candidate) => candidate.key === key);

  if (!bread) throw new Error(`[e2e] no se sembró el pan «${key}»`);

  return bread;
}
