import { useTranslations } from "next-intl";
import { BANNER_FORMATS } from "~/app/api/ofertas/banner/OffersBannerImage";
import { type AppHref, Link } from "~/i18n/navigation";
import Carousel from "~/presentation/design_system/carousel/Carousel";
import type { OffersSlide } from "./homeOffers";

/**
 * Desde qué ancho de pantalla se pinta el formato `ancho`. Por debajo, el `compacto`: una fila de
 * cuatro en una pantalla angosta deja los precios ilegibles.
 */
const WIDE_FROM = "(min-width: 1024px)";

function OffersBanner({
  slide,
  eager,
}: {
  slide: OffersSlide;
  eager: boolean;
}) {
  const { ancho, compacto } = BANNER_FORMATS;

  return (
    <Link
      href={{ pathname: "/productos", query: slide.catalogQuery } as AppHref}
      data-testid="home-offers-banner"
      data-slide={slide.key}
      className="focus-ring block"
    >
      <picture className="block">
        <source
          media={WIDE_FROM}
          srcSet={slide.images.ancho}
          width={ancho.width}
          height={ancho.height}
        />
        {/* `<img>` y no next/image: `<picture>` elige el formato por ancho de pantalla, y
            next/image no sabe hacerlo. Es un PNG ya hecho a la medida por nuestra ruta. */}
        <img
          src={slide.images.compacto}
          alt={slide.alt}
          width={compacto.width}
          height={compacto.height}
          /* El primero es lo primero de la página; los demás esperan a que les toque. */
          loading={eager ? "eager" : "lazy"}
          data-testid="home-offers-banner-image"
          className="block h-auto w-full"
        />
      </picture>
    </Link>
  );
}

/**
 * El carrusel de ofertas del inicio. **Ocupa el lugar del hero** cuando hay alguna promoción
 * vigente, en escritorio y en el teléfono, como el carrusel principal de un marketplace; sin ofertas
 * no existe y el hero vuelve.
 *
 * Primero el banner con todas, después uno por marca (o por tienda) que junte dos o más
 * (`groupBannerPromotions`). Cada uno lleva al catálogo filtrado a esas mismas ofertas.
 *
 * La imagen se elige con `<picture>`, no con CSS: así el teléfono **solo descarga** el formato
 * compacto, y el escritorio solo el ancho.
 */
export default function OffersCarousel({
  slides,
}: {
  slides: readonly OffersSlide[];
}) {
  const t = useTranslations("home");

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
        slides={slides.map((slide, index) => (
          <OffersBanner key={slide.key} slide={slide} eager={index === 0} />
        ))}
      />
    </section>
  );
}
