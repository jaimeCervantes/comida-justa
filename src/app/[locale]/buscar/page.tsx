import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  parsePublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { EmptyState } from "~/presentation/design_system/feedback/EmptyState";
import { CARD_MASONRY } from "~/presentation/design_system/surfaces/cardList";
import { Heading } from "~/presentation/design_system/typography/Heading";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";
import PublicationPillarFilter from "~/presentation/post/PublicationPillarFilter";
import { publicationPillarEmptyMessage } from "~/presentation/post/publicationPillarEmptyMessage";
import { SEARCH_PAGE_SIZE, searchPosts } from "./data";

/**
 * Esta ruta se sirve como `/buscar` en español y `/search` en inglés; lo decide `pathnames` en
 * `routing.ts`. Antes existían **dos carpetas**, `buscar/` y `search/`, con el mismo componente
 * copiado y ya divergido: la inglesa pasaba `locale` a la API y la española no, y a cambio la
 * española paginaba —hacia `/search/…`, o sea hacia la otra— con el término escapado. Se quedó
 * esta, con lo mejor de las dos.
 */
export default async function SearchPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ q?: string; page?: string; pillar?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { q = "", page = "1", pillar } = await searchParams;
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const currentPillar = parsePublicationPillar(pillar);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("search");
  const pillarT = await getTranslations("publicationPillars");
  const pageInt = parseInt(page || "1", 10);
  const data = await searchPosts(q, pageInt, locale, currentPillar);
  const cards = await mapPostsToCardsForLocale(data.results, locale);
  const totalPages = Math.ceil(data.total / SEARCH_PAGE_SIZE);

  return (
    <>
      <Heading level={1} className="my-4">
        {t("resultsHeading")}
      </Heading>
      {q && (
        <div className="mb-4 text-text-support">
          {t("showingResultsFor")}{" "}
          <span className="font-semibold text-pw-green">
            {/* `q` sale de `searchParams`, que Next ya entrega decodificado: volver a decodificar
                aquí **lanzaba** con un `%` suelto —buscar «50% descuento» tumbaba la página con un
                500— y no arreglaba nada, porque no había nada que decodificar. */}
            {q}
          </span>
        </div>
      )}
      <PublicationPillarFilter
        currentPillar={currentPillar}
        pathname="/buscar"
        query={{ q }}
      />
      {q && cards.length === 0 && (
        <EmptyState
          testId="search-empty"
          title={publicationPillarEmptyMessage({
            currentPillar,
            fallback: t("noResults"),
            t: pillarT,
          })}
          action={
            <Link
              href="/productos"
              /* `default` y no `white`: la tarjeta del vacío ya es blanca, y el relleno blanco
                 dejaba el botón sin silueta. */
              className={buttonVariants({ color: "default", size: "sm" })}
            >
              {t("noResultsCta")}
            </Link>
          }
        >
          {t("noResultsBody")}
        </EmptyState>
      )}
      <section className={`${CARD_MASONRY} pt-6`}>
        {cards.map((card) => (
          <CardForList key={card.id} {...card} viewerId={viewerId} />
        ))}
      </section>
      <Pagination
        currentPage={pageInt}
        totalPages={totalPages}
        pathname="/buscar"
        pageQueryParam="page"
        query={{
          q,
          [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar ?? undefined,
        }}
      />
    </>
  );
}
