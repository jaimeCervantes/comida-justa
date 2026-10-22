import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { type HomeOffers, loadHomeOffers } from "~/app/(home)/homeOffers";
import { brandKey } from "~/domain/entities/post/brand";
import {
  BRAND_QUERY_PARAM,
  parseBrandFilter,
  parseStoreFilter,
  STORE_QUERY_PARAM,
} from "~/domain/entities/post/catalogFilters";
import type { BannerPromotion } from "~/domain/entities/post/promotionBanner";
import { FORMATTING_LOCALE } from "~/i18n/formattingLocale";
import { resolveLocale } from "~/i18n/routing";
import { SITE_CURRENCY } from "~/infra/constants";
import { cutoutProductPhoto } from "~/infra/images/cutoutProductPhoto";
import OffersBannerImage, {
  BANNER_FORMATS,
  type BannerFormat,
  type BannerTile,
  isBannerFormat,
} from "./OffersBannerImage";

/* `sharp` y `fs` son de Node: esta ruta no puede ir al runtime de borde. */
export const runtime = "nodejs";

/**
 * Cuánto puede guardar la imagen un navegador o una CDN. Poco, aunque la dirección cambie con la
 * huella: una promoción que **vence** no cambia ningún dato de la base, solo la hora, y la imagen
 * vieja seguiría anunciándola hasta que alguien pidiera la portada de nuevo.
 */
const CACHE_SECONDS = 300;

/* El tope de la foto de un producto (~200×280 en el banner), con margen para que no se vea
   borrosa. Más grande solo engordaría el PNG. */
const PHOTO_MAX = 600;

const ASSETS_DIR = join(process.cwd(), "src", "assets");

/* Se leen una vez por proceso: son los mismos archivos en cada petición. */
let fontsPromise: Promise<
  { name: string; data: Buffer; weight: 500 | 800; style: "normal" }[]
> | null = null;
const backgrounds = new Map<BannerFormat, Promise<string | null>>();

function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(join(ASSETS_DIR, "fonts", "PlusJakartaSans-Medium.ttf")),
    readFile(join(ASSETS_DIR, "fonts", "PlusJakartaSans-ExtraBold.ttf")),
  ]).then(([medium, extraBold]) => [
    { name: "Plus Jakarta Sans", data: medium, weight: 500, style: "normal" },
    {
      name: "Plus Jakarta Sans",
      data: extraBold,
      weight: 800,
      style: "normal",
    },
  ]);

  return fontsPromise;
}

/** El arte de fondo del formato, o `null` si falta el archivo: el banner cae a un degradado liso. */
function loadBackground(format: BannerFormat): Promise<string | null> {
  const cached = backgrounds.get(format);

  if (cached) return cached;

  const loading = readFile(
    join(ASSETS_DIR, "banners", BANNER_FORMATS[format].background),
  )
    .then((png) => `data:image/png;base64,${png.toString("base64")}`)
    .catch(() => null);

  backgrounds.set(format, loading);

  return loading;
}

/**
 * La foto de un producto, en algo que Satori sabe leer: sin su fondo blanco si era de estudio, para
 * que flote sobre el banner (`cutoutProductPhoto`).
 *
 * Las fotos del catálogo están en WebP y Satori no decodifica WebP, así que siempre pasan por
 * `sharp`. Una foto que no se puede bajar no tumba el banner: el producto se queda sin foto y su
 * precio y su descuento se siguen leyendo.
 *
 * **Tiene que ser el mismo `sharp` que usa `next/og`.** En Node, `ImageResponse` rasteriza con
 * `sharp` (lo importa desde Next), y dos copias de libvips en el mismo proceso chocan: con el
 * proyecto en 0.35 y Next en 0.34, cada banner fallaba con `colourspace: parameter space not set`.
 * Por eso `package.json` fija `sharp` en la misma versión que pide Next.
 */
async function toPhoto(
  url: string,
): Promise<{ photo: string; isCutout: boolean }> {
  try {
    const response = await fetch(url);

    if (!response.ok) return { photo: BLANK_PHOTO, isCutout: true };

    const { png, isCutout } = await cutoutProductPhoto(
      Buffer.from(await response.arrayBuffer()),
      PHOTO_MAX,
      PHOTO_MAX,
    );

    return {
      photo: `data:image/png;base64,${png.toString("base64")}`,
      isCutout,
    };
  } catch {
    return { photo: BLANK_PHOTO, isCutout: true };
  }
}

/** Un píxel transparente, para el producto cuya foto no se pudo bajar. */
const BLANK_PHOTO =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>";

/**
 * Qué pinta el banner pedido: el general, o un grupo si la dirección trae `marca` o `tienda`.
 * `null` si se pidió un grupo que no existe (ya no junta dos ofertas, o nunca existió).
 */
function pickSlide(
  offers: HomeOffers,
  params: URLSearchParams,
): {
  label: string | null;
  promotions: BannerPromotion[];
  count: number;
} | null {
  const brand = parseBrandFilter(params.get(BRAND_QUERY_PARAM));
  const store = parseStoreFilter(params.get(STORE_QUERY_PARAM));

  if (!brand && !store) {
    return { label: null, promotions: offers.general, count: offers.total };
  }

  const group = offers.groups.find((candidate) =>
    "brand" in candidate.filter
      ? brand !== null && brandKey(candidate.filter.brand) === brandKey(brand)
      : candidate.filter.store === store,
  );

  return group
    ? { label: group.label, promotions: group.promotions, count: group.count }
    : null;
}

/**
 * `GET /api/ofertas/banner?locale=es&formato=ancho[&marca=…|&tienda=…]&v=<huella>` → el banner de
 * ofertas en PNG.
 *
 * `formato` es uno de `BANNER_FORMATS` (`ancho`, `compacto`); sin él, `ancho`. Con `marca` o
 * `tienda`, el banner de ese grupo (`groupBannerPromotions`).
 * `v` no se lee: solo hace que la dirección cambie cuando cambia el conjunto de promociones (ver
 * `promotionsFingerprint`). Sin promociones vigentes no hay banner que dibujar: 404.
 */
export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const locale = resolveLocale(params.get("locale") ?? "");
  /* Sin formato, o con uno que no existe, el ancho. */
  const requested = params.get("formato");
  const format = isBannerFormat(requested) ? requested : "ancho";
  const { width, height, maxProducts } = BANNER_FORMATS[format];
  const slide = pickSlide(await loadHomeOffers(locale), params);

  if (!slide || slide.promotions.length === 0) {
    return new Response(null, { status: 404 });
  }

  const { label, promotions, count } = slide;

  const t = await getTranslations({ locale, namespace: "home" });
  const money = (amount: number) =>
    new Intl.NumberFormat(FORMATTING_LOCALE[locale], {
      style: "currency",
      currency: SITE_CURRENCY,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  const shown = promotions.slice(0, maxProducts);
  const tiles: BannerTile[] = await Promise.all(
    shown.map(async (promotion) => ({
      ...promotion,
      ...(await toPhoto(promotion.imageUrl)),
      priceLabel: money(promotion.price),
      regularPriceLabel: money(promotion.regularPrice),
    })),
  );
  /* El titular presume el descuento más grande: es lo que hace que alguien se detenga. Las
     promociones ya vienen de mayor a menor (`selectBannerPromotions`). */
  const biggest = promotions[0].discountPercent;

  return new ImageResponse(
    <OffersBannerImage
      format={format}
      tiles={tiles}
      background={await loadBackground(format)}
      texts={{
        /* En un grupo, la marca o la tienda va en la píldora: es lo que distingue ese slide. */
        eyebrow: label ?? t("offersBannerEyebrow"),
        headline: t("offersBannerHeadline", { percent: biggest }),
        subtitle: t("offersBannerSubtitle", { count }),
        cta: t("offersBannerCta"),
        discount: (percent) => t("offersDiscount", { percent }),
      }}
    />,
    {
      width,
      height,
      fonts: await loadFonts(),
      headers: {
        "Cache-Control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
      },
    },
  );
}
