import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import HomeHero from "~/app/(home)/HomeHero";
import { measuredFrom } from "~/app/(home)/measuredFrom";
import PostsWithLoadMore from "~/app/(home)/PostsWithLoadMore";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import { buildSiteJsonLd } from "~/domain/seo/jsonLd/site";
import { ensureAbsoluteUrl } from "~/domain/seo/url";
import { resolveLocale, routing } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import {
  BRAND_SOCIAL_URLS,
  CANONICAL_URL,
  DEFAULT_SHARE_IMAGE,
  PAGINATION_INIT_PAGE,
  PAGINATION_PAGE_SIZE,
  PUBLIC_BRAND_NAME,
} from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { readCommunityGarden } from "~/infra/habits/readCommunityGarden";
import { readRecentPublicCelebrations } from "~/infra/habits/readRecentPublicCelebrations";
import { readViewerLocationContext } from "~/infra/location/viewerLocationContext";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";
import CommunityHabitGarden from "~/presentation/habits/CommunityHabitGarden";
import PublicHabitCelebrationList from "~/presentation/habits/PublicHabitCelebrationList";
import LocationBanner from "~/presentation/location/LocationBanner";
import JsonLd from "~/presentation/seo/JsonLd";
import { setHabitCelebrationReaction } from "./habitCommunityActions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      images: [DEFAULT_SHARE_IMAGE],
      type: "website",
    },
    alternates: {
      ...localizedAlternates("/", locale),
      /* El feed se anuncia desde el home: es donde lo buscan tanto un lector de RSS como los
         rastreadores que lo usan para enterarse de lo nuevo sin recorrer el sitio entero. */
      types: {
        "application/rss+xml": [
          { url: "/rss.xml", title: `${PUBLIC_BRAND_NAME} — publicaciones` },
        ],
      },
    },
  };
}

/**
 * El home enseña dos celebraciones, las que caben en la media fila que comparte con el jardín. Las
 * ocho de la lista completa viven en `/pilares`, donde la sección ocupa todo el ancho.
 */
const HOME_CELEBRATION_LIST_LIMIT = 2;

/**
 * El home mantiene su orden cronológico y **solo** gana distancias.
 *
 * Es un feed: lo que promete es lo último que publicó la comunidad, y reordenarlo por cercanía
 * rompería esa promesa —quien entra a ver qué hay de nuevo dejaría de verlo—. El orden por cercanía
 * es del catálogo, donde la pregunta es "¿dónde compro esto?". Aquí la distancia es un dato de cada
 * tarjeta, no un criterio.
 */
async function getPosts(locale: string, near: Coordinates | null) {
  const postRepo = createPostQueryRepository();

  const result = await postRepo.getMultiplePosts(
    PAGINATION_INIT_PAGE,
    PAGINATION_PAGE_SIZE,
    near,
  );

  return {
    ...result,
    posts: await mapPostsToCardsForLocale(result.posts, locale),
  };
}

export default async function Inicio({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const [t, habitT] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "atomicChallenges" }),
  ]);
  const { visitor, showSellerCta } = await readViewerLocationContext();
  const [{ posts, total, totalPages }, celebrations, garden] =
    await Promise.all([
      getPosts(locale, visitor),
      readRecentPublicCelebrations(viewerId, HOME_CELEBRATION_LIST_LIMIT),
      readCommunityGarden(),
    ]);

  return (
    <main className="space-y-8">
      {/* Quién publica el sitio. Va en el home y no en el layout: repetir la organización en cada
          página no la hace más creíble, y aquí es donde un rastreador entra primero. */}
      <JsonLd
        data={buildSiteJsonLd({
          siteUrl: CANONICAL_URL,
          brandName: PUBLIC_BRAND_NAME,
          logoUrl: ensureAbsoluteUrl(CANONICAL_URL, DEFAULT_SHARE_IMAGE),
          description: t("description"),
          sameAs: BRAND_SOCIAL_URLS,
          inLanguage: locale,
        })}
      />
      {/* La ubicación sube a la portada: es lo primero que decide si el feed de abajo puede hablar
          de distancias, y como aviso suelto entre el hero y las tarjetas se leía como un error. */}
      <HomeHero
        locationPanel={<LocationBanner showSellerCta={showSellerCta} />}
      />

      <section className="relative isolate overflow-hidden">
        {/* Jardín y celebraciones comparten una fila: son la misma idea —lo que la comunidad
              lleva hecho— y apiladas empujaban el feed muy abajo. Si no hay celebraciones que
              mostrar, el jardín se queda con todo el ancho en vez de dejar media fila vacía. */}
        <div
          className={`grid gap-6 lg:items-start ${
            celebrations.length > 0 ? "lg:grid-cols-2" : ""
          }`}
        >
          <CommunityHabitGarden garden={garden} variant="compact" />

          <PublicHabitCelebrationList
            title={habitT("experienceCommon.communityCelebrationsTitle")}
            celebrations={celebrations}
            viewerSignedIn={viewerId !== null}
            reactionAction={setHabitCelebrationReaction}
            variant="compact"
          />
        </div>
      </section>

      {/* La `key` es desde dónde se midieron estas distancias. El feed acumula en estado las
          páginas que pide, así que sin esto una ubicación corregida repintaba el chip y dejaba las
          tarjetas como estaban. Ver `measuredFrom`. */}
      <PostsWithLoadMore
        key={measuredFrom(visitor)}
        viewerId={viewerId}
        initialPosts={posts}
        totalPosts={total}
        totalPages={totalPages}
        locale={locale}
      />
    </main>
  );
}
