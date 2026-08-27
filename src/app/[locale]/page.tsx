import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import HomeHero from "~/app/(home)/HomeHero";
import { homeFeedKey } from "~/app/(home)/homeFeedKey";
import PostsWithLoadMore from "~/app/(home)/PostsWithLoadMore";
import {
  type PublicationPillar,
  parsePublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import { SUSTAINABLE_RADIUS_METERS } from "~/domain/entities/seller/proximity";
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
import { categoryKeysForActivePublicationPillar } from "~/infra/dataAccess/posts/publicationPillarFilter";
import { readViewerLocationContext } from "~/infra/location/viewerLocationContext";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";
import { Heading } from "~/presentation/design_system/typography/Heading";
import JsonLd from "~/presentation/seo/JsonLd";

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
 * El home mantiene su orden cronológico y **solo** gana distancias.
 *
 * Es un feed: lo que promete es lo último que publicó la comunidad, y reordenarlo por cercanía
 * rompería esa promesa —quien entra a ver qué hay de nuevo dejaría de verlo—. El orden por cercanía
 * es del catálogo, donde la pregunta es "¿dónde compro esto?". Aquí la distancia es un dato de cada
 * tarjeta, no un criterio.
 */
async function getPosts(
  locale: string,
  near: Coordinates | null,
  currentPillar: PublicationPillar | null,
) {
  const postRepo = createPostQueryRepository();

  const result = await postRepo.getMultiplePosts(
    PAGINATION_INIT_PAGE,
    PAGINATION_PAGE_SIZE,
    near,
    {
      categoryKeys: await categoryKeysForActivePublicationPillar(currentPillar),
    },
  );

  return {
    ...result,
    posts: await mapPostsToCardsForLocale(result.posts, locale),
  };
}

export default async function Inicio({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pillar?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const { pillar } = await searchParams;
  const locale = resolveLocale(rawLocale);
  const currentPillar = parsePublicationPillar(pillar);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const [t, tFeed] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "feed" }),
  ]);
  const { visitor } = await readViewerLocationContext();
  const { posts, total, totalPages } = await getPosts(
    locale,
    visitor,
    currentPillar,
  );

  /*
   * Cuánto de lo publicado le queda cerca a quien mira, y a qué distancia lo más cercano.
   *
   * Solo se pregunta cuando sabemos dónde está: sin ubicación no hay radio que medir, y preguntarlo
   * contra el ancla devolvería «lo que hay cerca de Tezonapa», que es el total disfrazado de dato
   * personal. `null` es la respuesta honesta y `HomeHero` la distingue.
   */
  const nearby = visitor
    ? await createPostQueryRepository().summarizeNearby(
        visitor,
        SUSTAINABLE_RADIUS_METERS,
      )
    : null;

  return (
    <main className="space-y-6">
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

      {/* **La portada y su encabezado son de escritorio.**
          En un teléfono, quien llega viene a ver productos y servicios sanos, y entre la barra de
          ubicación, el mensaje de la comunidad y una portada a pantalla completa la primera tarjeta
          caía por debajo del pliegue: el sitio se presentaba en vez de enseñar. En escritorio hay
          ancho de sobra y la portada se lee sin desplazar nada importante.

          La cifra sale del `total` que ya trajo la consulta del feed, y `posts[0]` es la más
          reciente porque el home es cronológico por contrato: ninguna de las dos cuesta una lectura
          extra. */}
      <div className="hidden lg:block lg:space-y-6">
        <HomeHero publicationCount={total} nearby={nearby} latest={posts[0]} />

        <Heading level={2} size="sm">
          {tFeed("latestHeading")}
        </Heading>
      </div>

      {/* La `key` cubre lo que invalida el estado acumulado del feed: desde dónde se miden las
          distancias y qué pilar se pidió. El feed guarda páginas en cliente; sin remount, cambiar
          `?pillar=` deja visibles tarjetas del filtro anterior. */}
      <PostsWithLoadMore
        key={homeFeedKey(visitor, currentPillar)}
        viewerId={viewerId}
        initialPosts={posts}
        totalPosts={total}
        totalPages={totalPages}
        locale={locale}
        currentPillar={currentPillar}
      />
    </main>
  );
}
