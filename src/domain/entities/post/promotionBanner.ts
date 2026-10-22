import { canBeOrdered } from "./availability";
import { brandKey } from "./brand";
import { currentPrice } from "./promotion";
import { carriesInventory } from "./stock";

/** De quién es una oferta, cuando no tiene marca: la tienda que la vende. */
export type BannerStore = { handle: string; name: string };

/** Una publicación candidata al banner de ofertas, con lo que la base dice de ella hoy. */
export type BannerCandidate = {
  postId: string;
  title: string;
  slug: string;
  /** La foto de portada, o `null` si no tiene: un banner de ofertas sin foto no se entiende. */
  imageUrl: string | null;
  price: number;
  salePrice: number | null;
  saleEndsAt: Date | string | null;
  /** `posts.brand`, ya normalizada. Nula = sin marca. */
  brand: string | null;
  store: BannerStore | null;
  kind: string;
  /** `posts.is_available`: el vendedor la marcó como agotada si es `false`. */
  isAvailable: boolean;
  /** `posts.stock_quantity`. Nulo no es cero: es no llevar inventario. */
  stockQuantity: number | null;
};

/**
 * ¿Se puede anunciar en el carrusel? Solo lo que tiene **piezas registradas**: que se pueda pedir
 * (`canBeOrdered`) y que lleve inventario con al menos una pieza.
 *
 * Es más estricto que la lista de ofertas (`onSaleWhere`), que también enseña lo que no cuenta
 * piezas: lo decidió el usuario el 2026-10-22. El carrusel es lo primero que se ve, y anunciar ahí
 * algo de lo que nadie sabe si queda es prometer de más. Por eso un servicio no sale en el carrusel:
 * no se cuenta en piezas, su disponibilidad es la agenda.
 */
export function canBeAdvertised(
  candidate: Pick<BannerCandidate, "kind" | "isAvailable" | "stockQuantity">,
): boolean {
  return (
    canBeOrdered(candidate) &&
    carriesInventory(candidate) &&
    (candidate.stockQuantity ?? 0) > 0
  );
}

/** Un producto ya dentro del banner: lo que se pinta, con la promoción resuelta. */
export type BannerPromotion = {
  postId: string;
  title: string;
  slug: string;
  imageUrl: string;
  /** El que se cobra hoy. */
  price: number;
  /** El normal, para tacharlo. */
  regularPrice: number;
  discountPercent: number;
  endsAt: Date | null;
  brand: string | null;
  store: BannerStore | null;
};

/**
 * Un slide de grupo del carrusel: las ofertas de una marca o, sin marca, de una tienda.
 *
 * `filter` es lo que se le pide al catálogo para llegar a esas mismas ofertas
 * (`/productos?promocion=1&marca=…`).
 */
export type BannerGroup = {
  key: string;
  label: string;
  filter: { brand: string } | { store: string };
  /** Las del grupo, de mayor a menor descuento, hasta `BANNER_MAX_PROMOTIONS`. */
  promotions: BannerPromotion[];
  /** Cuántas tiene el grupo en total, aunque el banner pinte menos. */
  count: number;
};

/** Cuántas caben en un banner. */
export const BANNER_MAX_PROMOTIONS = 4;

/** Desde cuántas ofertas una marca o una tienda tiene su propio slide. */
export const MIN_PROMOTIONS_PER_GROUP = 2;

/** Cuántos slides de grupo, además del general: más ya no se recorren. */
export const MAX_BANNER_GROUPS = 4;

/**
 * Todas las promociones vigentes y con foto, de mayor a menor descuento.
 *
 * **Solo las vigentes**, decididas con `currentPrice` —la misma regla de la ficha, el carrito y el
 * filtro—, **solo lo que se puede comprar** (`canBeAdvertised`) y **solo con foto**: el banner es una imagen hecha de fotos, y un hueco ahí se lee como
 * un error, no como una oferta. Primero el descuento más grande, que es lo que hace que alguien se
 * detenga; a igual descuento manda el orden en que llegaron.
 */
export function activeBannerPromotions(
  candidates: readonly BannerCandidate[],
  now: Date,
): BannerPromotion[] {
  return candidates
    .flatMap((candidate, index) => {
      if (!candidate.imageUrl || !canBeAdvertised(candidate)) return [];

      const current = currentPrice(candidate, now);

      if (current.regularPrice === null || current.discountPercent === null) {
        return [];
      }

      return [
        {
          index,
          promotion: {
            postId: candidate.postId,
            title: candidate.title,
            slug: candidate.slug,
            imageUrl: candidate.imageUrl,
            price: current.price,
            regularPrice: current.regularPrice,
            discountPercent: current.discountPercent,
            endsAt: current.endsAt,
            brand: candidate.brand,
            store: candidate.store,
          },
        },
      ];
    })
    .sort(
      (a, b) =>
        b.promotion.discountPercent - a.promotion.discountPercent ||
        a.index - b.index,
    )
    .map(({ promotion }) => promotion);
}

/** Las del banner general: las vigentes de mayor descuento, hasta `limit`. */
export function selectBannerPromotions(
  candidates: readonly BannerCandidate[],
  now: Date,
  limit: number = BANNER_MAX_PROMOTIONS,
): BannerPromotion[] {
  return activeBannerPromotions(candidates, now).slice(0, limit);
}

function groupOf(
  promotion: BannerPromotion,
): Omit<BannerGroup, "promotions" | "count"> | null {
  if (promotion.brand) {
    return {
      key: `brand:${brandKey(promotion.brand)}`,
      label: promotion.brand,
      filter: { brand: promotion.brand },
    };
  }

  if (promotion.store) {
    return {
      key: `store:${promotion.store.handle}`,
      label: promotion.store.name,
      filter: { store: promotion.store.handle },
    };
  }

  return null;
}

/**
 * Los slides de grupo del carrusel: uno por marca y, para lo que no tiene marca, uno por tienda.
 *
 * - **La marca, sin distinguir mayúsculas** («Birdman» y «birdman» van juntas). El nombre que se
 *   enseña es el de la primera oferta del grupo, la de mayor descuento.
 * - **Solo desde `MIN_PROMOTIONS_PER_GROUP` ofertas.** Una marca con una sola oferta ya sale en el
 *   banner general, y un slide para un producto suelto es lo que este slice vino a evitar.
 * - **Un grupo que junta todas las ofertas no tiene slide**: repetiría el banner general con otro
 *   título. Es el caso de hoy, con las cinco promociones de una misma tienda.
 * - De mayor a menor descuento, hasta `MAX_BANNER_GROUPS`.
 *
 * Recibe las de `activeBannerPromotions`, ya ordenadas, así que cada grupo hereda el orden.
 */
export function groupBannerPromotions(
  active: readonly BannerPromotion[],
): BannerGroup[] {
  const groups = new Map<string, BannerGroup>();

  for (const promotion of active) {
    const group = groupOf(promotion);

    if (!group) continue;

    const existing = groups.get(group.key) ?? {
      ...group,
      promotions: [],
      count: 0,
    };

    existing.count += 1;
    if (existing.promotions.length < BANNER_MAX_PROMOTIONS) {
      existing.promotions.push(promotion);
    }
    groups.set(group.key, existing);
  }

  return [...groups.values()]
    .filter(
      (group) =>
        group.count >= MIN_PROMOTIONS_PER_GROUP && group.count < active.length,
    )
    .slice(0, MAX_BANNER_GROUPS);
}

/**
 * Una huella corta de un conjunto de promociones.
 *
 * Va en la dirección de la imagen (`?v=…`): si cambia un precio, una foto, el orden o una fecha de
 * fin, cambia la dirección y el navegador pide la imagen nueva en vez de servir la vieja de su
 * caché. FNV-1a de 32 bits: no es criptografía, solo tiene que cambiar cuando cambia lo que se pinta.
 */
export function promotionsFingerprint(
  promotions: readonly BannerPromotion[],
): string {
  const source = promotions
    .map((promotion) =>
      [
        promotion.postId,
        promotion.price,
        promotion.regularPrice,
        promotion.imageUrl,
        promotion.title,
        promotion.endsAt?.toISOString() ?? "",
      ].join("|"),
    )
    .join("\n");
  let hash = 0x811c9dc5;

  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
}
