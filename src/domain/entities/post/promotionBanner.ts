import { currentPrice } from "./promotion";

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
};

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
};

/** Cuántas caben en el banner: cuatro, en una rejilla de dos por dos. */
export const BANNER_MAX_PROMOTIONS = 4;

/**
 * Qué promociones salen en el banner de la portada, y en qué orden.
 *
 * **Solo las vigentes**, decididas con `currentPrice` —la misma regla de la ficha, el carrito y el
 * filtro—, y **solo con foto**: el banner es una imagen hecha de fotos, y un hueco ahí se lee como
 * un error, no como una oferta. Primero el descuento más grande, que es lo que hace que alguien se
 * detenga; a igual descuento manda el orden en que llegaron.
 */
export function selectBannerPromotions(
  candidates: readonly BannerCandidate[],
  now: Date,
  limit: number = BANNER_MAX_PROMOTIONS,
): BannerPromotion[] {
  return candidates
    .flatMap((candidate, index) => {
      if (!candidate.imageUrl) return [];

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
          },
        },
      ];
    })
    .sort(
      (a, b) =>
        b.promotion.discountPercent - a.promotion.discountPercent ||
        a.index - b.index,
    )
    .slice(0, limit)
    .map(({ promotion }) => promotion);
}

/**
 * Una huella corta del conjunto de promociones del banner.
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
