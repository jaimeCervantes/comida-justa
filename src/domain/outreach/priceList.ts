import { isPubliclyVisible } from "~/domain/entities/post/moderation";
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
  isAvailable: boolean;
  /** `posts.stock_quantity`. **Nulo no es cero**: es no llevar inventario. */
  stockQuantity: number | null;
  moderationStatus: string;
}

export type ListingDecision =
  | { listed: true; price: number }
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
 */
export function decideListing(product: OutreachListedProduct): ListingDecision {
  if (!isPubliclyVisible(product)) {
    return { listed: false, reason: "not-published" };
  }
  if (isOutOfStock(product)) return { listed: false, reason: "out-of-stock" };
  if (!product.isAvailable) return { listed: false, reason: "unavailable" };
  if (product.price === null) return { listed: false, reason: "no-price" };

  return { listed: true, price: product.price };
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
 */
export function buildPriceList(
  products: readonly OutreachListedProduct[],
): PriceList {
  const byPrice = new Map<number, OutreachListedProduct[]>();
  const excluded: ExcludedProduct[] = [];

  for (const product of [...products].sort((a, b) => a.position - b.position)) {
    const decision = decideListing(product);

    if (!decision.listed) {
      excluded.push({
        postId: product.postId,
        label: product.label,
        reason: decision.reason,
      });
      continue;
    }

    byPrice.set(decision.price, [
      ...(byPrice.get(decision.price) ?? []),
      product,
    ]);
  }

  const lines = [...byPrice.entries()]
    .sort(([cheaper], [pricier]) => cheaper - pricier)
    .map(([price, group]) => renderLine(price, group));

  return { lines, excluded };
}

function renderLine(
  price: number,
  group: readonly OutreachListedProduct[],
): string {
  const emoji = group.map((product) => product.emoji?.trim()).find(Boolean);
  const labels = group.map((product) => product.label.trim()).join(" / ");

  return `${emoji ? `${emoji} ` : ""}${labels} — ${formatListPrice(price)}`;
}
