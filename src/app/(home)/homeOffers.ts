import {
  type BannerFormat,
  bannerVersion,
} from "~/app/api/ofertas/banner/OffersBannerImage";
import { normalizeBrand } from "~/domain/entities/post/brand";
import {
  BRAND_QUERY_PARAM,
  STORE_QUERY_PARAM,
} from "~/domain/entities/post/catalogFilters";
import { ON_SALE_QUERY_PARAM } from "~/domain/entities/post/promotion";
import {
  activeBannerPromotions,
  BANNER_MAX_PROMOTIONS,
  type BannerCandidate,
  type BannerGroup,
  type BannerPromotion,
  groupBannerPromotions,
  promotionsFingerprint,
} from "~/domain/entities/post/promotionBanner";
import { resolvePostTranslation } from "~/domain/entities/post/translations";
import { routing } from "~/i18n/routing";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import type { PostData } from "~/infra/dataAccess/posts/IPostQueryRepository";

/**
 * Cuántas promociones vigentes se leen para armar el carrusel.
 *
 * El banner general toma las cuatro de mayor descuento, pero los grupos por marca necesitan ver el
 * resto para saber qué marca junta dos o más. Era 60, y con 150 ofertas el banner decía «60
 * productos rebajados» y una marca podía quedarse sin su slide: ahora el total sale de la base
 * (`total`), y esta cifra solo acota lo que se agrupa.
 */
const CANDIDATES_TO_READ = 300;

/** Lo que hay en promoción ahora: las del banner general, los grupos y cuántas son en total. */
export type HomeOffers = {
  general: BannerPromotion[];
  groups: BannerGroup[];
  total: number;
};

/**
 * Un slide del carrusel de ofertas, antes de pedir su imagen. Lo arma `buildHomeOffersSlides`.
 */
export type OffersSlide = {
  /** `general`, o la llave del grupo (`brand:birdman`, `store:la-luz`). */
  key: string;
  /** La marca o la tienda del slide; `null` en el general. */
  label: string | null;
  /** Una dirección por formato. Cambia cuando cambia lo que el slide pinta. */
  images: Record<BannerFormat, string>;
  /** Qué dice la imagen, para quien no la ve: cada producto con su descuento. */
  alt: string;
  /** A dónde lleva: el catálogo filtrado a esas mismas ofertas. */
  catalogQuery: Record<string, string>;
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
    brand: normalizeBrand(post.brand),
    store: post.seller
      ? { handle: post.seller.handle, name: post.seller.name }
      : null,
    kind: post.kind ?? "",
    isAvailable: post.isAvailable !== false,
    stockQuantity: post.stockQuantity ?? null,
  };
}

/**
 * Lo que está en promoción ahora, listo para el carrusel.
 *
 * Lo leen **dos** sitios: la página de inicio, para decidir si hay carrusel y armar la dirección de
 * cada imagen, y la ruta que pinta esas imágenes. Las dos preguntan lo mismo con la misma función,
 * así que el `alt` que lee la página describe exactamente la imagen que dibuja la ruta.
 *
 * El filtro de la base (`onSale`) es el de `/productos?promocion=1`; la decisión final, con la hora,
 * la toma `activeBannerPromotions`.
 */
export async function loadHomeOffers(
  locale: string,
  now: Date = new Date(),
): Promise<HomeOffers> {
  /* `inStock` en la base, además de `canBeAdvertised` en el dominio: así el total que cuenta la
     base es el de lo que el carrusel puede anunciar, y no se leen cientos de filas para tirarlas. */
  const { posts, total } = await createPostQueryRepository().getProducts(
    1,
    CANDIDATES_TO_READ,
    null,
    { onSale: true, inStock: true },
  );
  const candidates = posts.flatMap((post) => {
    const candidate = toCandidate(post, locale);

    return candidate ? [candidate] : [];
  });
  const active = activeBannerPromotions(candidates, now);

  return {
    general: active.slice(0, BANNER_MAX_PROMOTIONS),
    groups: groupBannerPromotions(active),
    /* El de la base cuando hay más de las que se leyeron; nunca menos de las que se van a pintar. */
    total: Math.max(total, active.length),
  };
}

/** Lo que el slide pide al catálogo, y a la ruta de la imagen, para quedarse con su grupo. */
function groupQuery(group: BannerGroup): Record<string, string> {
  return "brand" in group.filter
    ? { [BRAND_QUERY_PARAM]: group.filter.brand }
    : { [STORE_QUERY_PARAM]: group.filter.store };
}

/**
 * Los slides del carrusel: el general primero y después uno por grupo. Vacío si no hay ninguna
 * oferta vigente, y entonces la página pinta el hero.
 *
 * La dirección de cada imagen lleva el idioma —los títulos y los precios salen en el de quien
 * mira—, el grupo y la huella de lo que pinta, para que una promoción nueva no se tape con la imagen
 * vieja de la caché.
 */
export function buildHomeOffersSlides(
  offers: HomeOffers,
  locale: string,
  texts: {
    alt: (items: string, label: string | null) => string;
    item: (promotion: BannerPromotion) => string;
  },
): OffersSlide[] {
  if (offers.general.length === 0) return [];

  const slide = (
    key: string,
    label: string | null,
    promotions: readonly BannerPromotion[],
    filter: Record<string, string>,
  ): OffersSlide => {
    const imageFor = (format: BannerFormat): string =>
      `/api/ofertas/banner?${new URLSearchParams({
        locale,
        formato: format,
        ...filter,
        v: bannerVersion(promotionsFingerprint(promotions)),
      }).toString()}`;

    return {
      key,
      label,
      images: { ancho: imageFor("ancho"), compacto: imageFor("compacto") },
      alt: texts.alt(promotions.map(texts.item).join(", "), label),
      catalogQuery: { [ON_SALE_QUERY_PARAM]: "1", ...filter },
    };
  };

  return [
    slide("general", null, offers.general, {}),
    ...offers.groups.map((group) =>
      slide(group.key, group.label, group.promotions, groupQuery(group)),
    ),
  ];
}
