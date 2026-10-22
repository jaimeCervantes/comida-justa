import type { BannerFormat } from "~/app/api/ofertas/banner/OffersBannerImage";
import {
  type BannerCandidate,
  type BannerPromotion,
  promotionsFingerprint,
  selectBannerPromotions,
} from "~/domain/entities/post/promotionBanner";
import { resolvePostTranslation } from "~/domain/entities/post/translations";
import { routing } from "~/i18n/routing";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import type { PostData } from "~/infra/dataAccess/posts/IPostQueryRepository";

/** Lo que la página sabe del banner antes de pedir la imagen. Lo arma `buildHomeOffersBanner`. */
export type HomeOffersBanner = {
  /**
   * Una dirección por formato (`/api/ofertas/banner?locale=…&formato=…&v=<huella>`). Cambian cuando
   * cambia el conjunto de promociones.
   */
  images: Record<BannerFormat, string>;
  /** Qué dice la imagen, para quien no la ve: cada producto con su descuento. */
  alt: string;
  count: number;
};

/**
 * Cuántas promociones vigentes se piden a la base para elegir las del banner.
 *
 * Más que las cuatro que caben: `selectBannerPromotions` descarta las que no tienen foto y ordena por
 * descuento, y si se pidieran cuatro justas, una sin foto dejaría un hueco que otra podía llenar.
 */
const CANDIDATES_TO_READ = 12;

/** Las promociones del banner de ofertas y la huella que va en la dirección de su imagen. */
export type HomeOffers = {
  promotions: BannerPromotion[];
  fingerprint: string;
};

function toCandidate(post: PostData, locale: string): BannerCandidate | null {
  if (post.price === null) return null;

  const translation = resolvePostTranslation(
    post.translations,
    locale,
    routing.defaultLocale,
  );
  const photo = post.media.find((file) => file.type === "image");

  return {
    postId: post.id,
    title: translation?.title ?? "",
    slug: translation?.slug ?? "",
    imageUrl: photo?.url ?? null,
    price: post.price,
    salePrice: post.salePrice ?? null,
    saleEndsAt: post.saleEndsAt ?? null,
  };
}

/**
 * Lo que está en promoción ahora, listo para el banner.
 *
 * Lo leen **dos** sitios: la página de inicio, para decidir si hay tarjeta de ofertas y armar la dirección de la
 * imagen, y la ruta que pinta esa imagen. Las dos preguntan lo mismo con la misma función, así que
 * el `alt` que lee la página describe exactamente la imagen que dibuja la ruta.
 *
 * El filtro de la base (`onSale`) es el de `/productos?promocion=1`; la decisión final, con la hora,
 * la toma `selectBannerPromotions`.
 */
export async function loadHomeOffers(
  locale: string,
  now: Date = new Date(),
): Promise<HomeOffers> {
  const { posts } = await createPostQueryRepository().getProducts(
    1,
    CANDIDATES_TO_READ,
    null,
    { onSale: true },
  );
  const candidates = posts.flatMap((post) => {
    const candidate = toCandidate(post, locale);

    return candidate ? [candidate] : [];
  });
  const promotions = selectBannerPromotions(candidates, now);

  return { promotions, fingerprint: promotionsFingerprint(promotions) };
}

/**
 * Lo que la tarjeta de ofertas necesita para pintar el banner, o `null` si no hay ninguna oferta
 * vigente.
 *
 * La dirección lleva el idioma —los títulos y los precios de la imagen salen en el de quien mira— y
 * la huella, para que una promoción nueva no se tape con la imagen vieja de la caché.
 */
export function buildHomeOffersBanner(
  offers: HomeOffers,
  locale: string,
  texts: {
    alt: (items: string) => string;
    item: (promotion: BannerPromotion) => string;
  },
): HomeOffersBanner | null {
  if (offers.promotions.length === 0) return null;

  const imageFor = (format: BannerFormat): string =>
    `/api/ofertas/banner?${new URLSearchParams({
      locale,
      formato: format,
      v: offers.fingerprint,
    }).toString()}`;

  return {
    images: {
      ancho: imageFor("ancho"),
      compacto: imageFor("compacto"),
    },
    alt: texts.alt(offers.promotions.map(texts.item).join(", ")),
    count: offers.promotions.length,
  };
}
