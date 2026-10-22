import { useTranslations } from "next-intl";
import { BANNER_FORMATS } from "~/app/api/ofertas/banner/OffersBannerImage";
import { ON_SALE_QUERY_PARAM } from "~/domain/entities/post/promotion";
import { type AppHref, Link } from "~/i18n/navigation";
import Carousel from "~/presentation/design_system/carousel/Carousel";
import type { HomeOffersBanner } from "./homeOffers";

/**
 * Desde qué ancho de pantalla se pinta el formato `ancho`. Por debajo, el `compacto`: una fila de
 * cuatro en una pantalla angosta deja los precios ilegibles.
 */
const WIDE_FROM = "(min-width: 1024px)";

/**
 * El carrusel de ofertas del inicio. **Ocupa el lugar del hero** cuando hay alguna promoción
 * vigente, en escritorio y en el teléfono, como el carrusel principal de un marketplace; sin ofertas
 * no existe y el hero vuelve.
 *
 * Hoy lleva el banner combinado; en el slice 2 suma un slide por producto.
 *
 * La imagen se elige con `<picture>`, no con CSS: así el teléfono **solo descarga** el formato
 * compacto, y el escritorio solo el ancho.
 */
export default function OffersCarousel({
  offers,
}: {
  offers: HomeOffersBanner;
}) {
  const t = useTranslations("home");
  const { ancho, compacto } = BANNER_FORMATS;

  const banner = (
    <Link
      key="banner"
      href={
        {
          pathname: "/productos",
          query: { [ON_SALE_QUERY_PARAM]: "1" },
        } as AppHref
      }
      data-testid="home-offers-banner"
      className="focus-ring block"
    >
      <picture className="block">
        <source
          media={WIDE_FROM}
          srcSet={offers.images.ancho}
          width={ancho.width}
          height={ancho.height}
        />
        {/* `<img>` y no next/image: `<picture>` elige el formato por ancho de pantalla, y
            next/image no sabe hacerlo. Es un PNG ya hecho a la medida por nuestra ruta. Sin
            `loading="lazy"`: es lo primero de la página. */}
        <img
          src={offers.images.compacto}
          alt={offers.alt}
          width={compacto.width}
          height={compacto.height}
          data-testid="home-offers-banner-image"
          className="block h-auto w-full"
        />
      </picture>
    </Link>
  );

  return (
    <section
      aria-label={t("offersBannerEyebrow")}
      data-testid="home-offers"
      className="overflow-hidden rounded-panel"
    >
      <Carousel
        testId="home-offers-carousel"
        labels={{
          region: t("offersBannerEyebrow"),
          previous: t("carouselPrevious"),
          next: t("carouselNext"),
          slide: t.raw("carouselSlide") as string,
          goTo: t.raw("carouselGoTo") as string,
        }}
        slides={[banner]}
      />
    </section>
  );
}
