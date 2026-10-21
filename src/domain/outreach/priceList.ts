import { isPubliclyVisible } from "~/domain/entities/post/moderation";
import { currentPrice } from "~/domain/entities/post/promotion";
import { isOutOfStock } from "~/domain/entities/post/stock";
import type { OutreachExclusionReason } from "./exclusionReasons";

/**
 * Un producto ligado a un texto de difusión, con lo que **hoy** dice la base de él.
 *
 * La etiqueta, el emoji y el orden son del texto; el precio, la disponibilidad y la moderación son
 * del producto y se leen cada vez. Es la separación que hace imposible anunciar un precio viejo:
 * aquí no hay ningún precio guardado que pueda quedarse atrás.
 */
export interface OutreachListedProduct {
  postId: string;
  /** Lo que se lee en la lista: «Natural», no «Pan de Masa Madre Natural». */
  label: string;
  emoji: string | null;
  /** Orden en que se agregó al texto. Decide el orden de las etiquetas dentro de un renglón. */
  position: number;
  kind: string;
  /** `posts.price` ya convertido a número. Nulo: no tiene precio. */
  price: number | null;
  /** `posts.sale_price` y `posts.sale_ends_at`. Ver `domain/entities/post/promotion.ts`. */
  salePrice?: number | null;
  saleEndsAt?: Date | string | null;
  isAvailable: boolean;
  /** `posts.stock_quantity`. **Nulo no es cero**: es no llevar inventario. */
  stockQuantity: number | null;
  moderationStatus: string;
}

export type ListingDecision =
  | {
      listed: true;
      /** El que se cobra hoy: el rebajado si hay promoción vigente. */
      price: number;
      /** El normal, para tacharlo, solo con promoción vigente. */
      regularPrice: number | null;
    }
  | { listed: false; reason: OutreachExclusionReason };

export interface ExcludedProduct {
  postId: string;
  label: string;
  reason: OutreachExclusionReason;
}

export interface PriceList {
  /** Un renglón por precio, del más barato al más caro. */
  lines: string[];
  /** Lo que quedó fuera, en el orden del texto, para avisárselo a quien publica. */
  excluded: ExcludedProduct[];
}

/**
 * ¿Sale en la lista, y a qué precio? Si no, ¿por qué?
 *
 * Los motivos se preguntan en el orden de `OUTREACH_EXCLUSION_REASONS`. «Agotado» va antes que
 * «no disponible» aunque los dos apaguen `is_available`, porque piden cosas distintas a quien lee
 * el aviso: el primero se arregla reponiendo y el segundo encendiéndolo.
 *
 * El precio es el de `currentPrice`, el mismo que cobra la tienda: anunciar el normal mientras se
 * cobra el rebajado escondía la oferta justo donde más se lee.
 */
export function decideListing(
  product: OutreachListedProduct,
  now: Date = new Date(),
): ListingDecision {
  if (!isPubliclyVisible(product)) {
    return { listed: false, reason: "not-published" };
  }
  if (isOutOfStock(product)) return { listed: false, reason: "out-of-stock" };
  if (!product.isAvailable) return { listed: false, reason: "unavailable" };
  if (product.price === null) return { listed: false, reason: "no-price" };

  const current = currentPrice(
    {
      price: product.price,
      salePrice: product.salePrice,
      saleEndsAt: product.saleEndsAt,
    },
    now,
  );

  return {
    listed: true,
    price: current.price,
    regularPrice: current.regularPrice,
  };
}

/**
 * El precio como en un letrero: sin centavos cuando no los hay.
 *
 * `$140` y no `$140.00`, que es como lo escribe quien vende y como se lee en un grupo. La
 * puntuación es la de México: coma para los miles y punto para los centavos.
 */
export function formatListPrice(price: number): string {
  const decimals = Number.isInteger(price) ? 0 : 2;

  return `$${price.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Los renglones de la lista de precios: los del mismo precio comparten renglón.
 *
 * Es como ya escribe quien vende —«🌻 Semillas / Integral / Ajo — $125»—, y es lo que hace que seis
 * panes quepan en tres renglones. El renglón lleva el primer emoji que aparezca entre sus productos,
 * en el orden en que se agregaron; repetirlos todos convertiría la lista en una fila de dibujos.
 *
 * **Lo rebajado va en su propio renglón**, con el precio normal tachado como lo tacha WhatsApp
 * (`~$180~ $150`). Juntarlo con lo que cuesta 150 de siempre escondería la oferta; por eso el
 * renglón se agrupa por los dos precios, no solo por el que se cobra.
 */
export function buildPriceList(
  products: readonly OutreachListedProduct[],
  now: Date = new Date(),
): PriceList {
  const byPrice = new Map<
    string,
    {
      price: number;
      regularPrice: number | null;
      group: OutreachListedProduct[];
    }
  >();
  const excluded: ExcludedProduct[] = [];

  for (const product of [...products].sort((a, b) => a.position - b.position)) {
    const decision = decideListing(product, now);

    if (!decision.listed) {
      excluded.push({
        postId: product.postId,
        label: product.label,
        reason: decision.reason,
      });
      continue;
    }

    const key = `${decision.price}|${decision.regularPrice ?? ""}`;
    const line = byPrice.get(key) ?? {
      price: decision.price,
      regularPrice: decision.regularPrice,
      group: [],
    };

    line.group.push(product);
    byPrice.set(key, line);
  }

  /* Del más barato al más caro; a igual precio, primero lo rebajado, que es la noticia. */
  const lines = [...byPrice.values()]
    .sort(
      (a, b) =>
        a.price - b.price ||
        Number(b.regularPrice !== null) - Number(a.regularPrice !== null),
    )
    .map(({ price, regularPrice, group }) =>
      renderLine(price, regularPrice, group),
    );

  return { lines, excluded };
}

function renderLine(
  price: number,
  regularPrice: number | null,
  group: readonly OutreachListedProduct[],
): string {
  const emoji = group.map((product) => product.emoji?.trim()).find(Boolean);
  const labels = group.map((product) => product.label.trim()).join(" / ");
  const struck =
    regularPrice === null ? "" : `~${formatListPrice(regularPrice)}~ `;

  return `${emoji ? `${emoji} ` : ""}${labels} — ${struck}${formatListPrice(price)}`;
}
