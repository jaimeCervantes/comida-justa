import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  parsePublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";
import { CARD_MASONRY } from "~/presentation/design_system/surfaces/cardList";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";
import PublicationPillarFilter from "~/presentation/post/PublicationPillarFilter";
import { publicationPillarEmptyMessage } from "~/presentation/post/publicationPillarEmptyMessage";
import { SEARCH_PAGE_SIZE, searchPosts } from "../../../data";
import { decodeSearchTerm } from "../../../decodeTerm";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; term: string; page: string }>;
  searchParams: Promise<{ pillar?: string }>;
}) {
  const { term, page, locale: rawLocale } = await params;
  const { pillar } = await searchParams;
  const locale = resolveLocale(rawLocale);
  const currentPillar = parsePublicationPillar(pillar);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("search");
  const pillarT = await getTranslations("publicationPillars");
  const pageInt = parseInt(page || "1", 10);
  /* Se decodifica **una vez** y lo usan la consulta y el encabezado. Antes la consulta recibía el
     segmento crudo (`bu%C3%B1uelos`) y solo el encabezado se decodificaba, así que cualquier
     término con acento devolvía cero mientras la página mostraba la palabra bien escrita. */
  const query = decodeSearchTerm(term);
  const data = await searchPosts(query, pageInt, locale, currentPillar);
  const cards = await mapPostsToCardsForLocale(data.results, locale);
  const totalPages = Math.ceil(data.total / SEARCH_PAGE_SIZE);

  return (
    <main>
      <h1 className="text-4xl font-extrabold mb-6 mt-4 text-gray-900 dark:text-gray-100">
        {t("resultsHeading")}
      </h1>
      {term && (
        <div className="mb-8 text-lg text-gray-600 dark:text-gray-400">
          {t("showingResultsFor")}{" "}
          <span className="font-bold text-pw-green">{query}</span>
        </div>
      )}
      <PublicationPillarFilter
        currentPillar={currentPillar}
        pathname="/buscar"
        query={{ q: query }}
      />
      {term && cards.length === 0 && (
        <div className="text-xl text-gray-500 text-center py-20">
          {publicationPillarEmptyMessage({
            currentPillar,
            fallback: t("noResults"),
            t: pillarT,
          })}
        </div>
      )}
      {/* Era la única que fijaba el número de columnas por punto de ruptura en vez de por ancho
          mínimo, así que ya se veía distinta al resto de los listados. */}
      <section className={`${CARD_MASONRY} pt-2 pb-10`}>
        {cards.map((card) => (
          <CardForList key={card.id} {...card} viewerId={viewerId} />
        ))}
      </section>
      <Pagination
        currentPage={pageInt}
        totalPages={totalPages}
        pathname="/buscar/[term]/page/[page]"
        params={{ term }}
        query={
          currentPillar
            ? { [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar }
            : undefined
        }
      />
    </main>
  );
}
