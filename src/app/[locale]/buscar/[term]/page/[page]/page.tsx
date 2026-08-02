import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
import CardForList from "~/infra/UI/components/CardForList/CardForList";
import Pagination from "~/infra/UI/components/Pagination";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";

async function fetchResults(
  term: string,
  page: number,
  pageSize: number,
  locale: string,
) {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || ""
    }/api/search?q=${encodeURIComponent(
      term,
    )}&limit=${pageSize}&page=${page}&locale=${locale}`,
  );
  return res.json();
}

export default async function SearchPage({
  params,
}: {
  params: Promise<{ locale: string; term: string; page: string }>;
}) {
  const { term, page, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("search");
  const pageInt = parseInt(page || "1", 10);
  const pageSize = 6;
  const data = term
    ? await fetchResults(term, pageInt, pageSize, locale)
    : { results: [], total: 0 };
  const cards = await mapPostsToCardsForLocale(data.results || [], locale);
  const totalPages = Math.ceil((data.total || 0) / pageSize);

  return (
    <main>
      <h1 className="text-4xl font-extrabold mb-6 mt-4 text-gray-900 dark:text-gray-100">
        {t("resultsHeading")}
      </h1>
      {term && (
        <div className="mb-8 text-lg text-gray-600 dark:text-gray-400">
          {t("showingResultsFor")}{" "}
          <span className="font-bold text-pw-green">
            {decodeURIComponent(term)}
          </span>
        </div>
      )}
      {term && cards.length === 0 && (
        <div className="text-xl text-gray-500 text-center py-20">
          {t("noResults")}
        </div>
      )}
      <section className="grid gap-8 pt-2 pb-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <CardForList key={card.id} {...card} />
        ))}
      </section>
      <Pagination
        currentPage={pageInt}
        totalPages={totalPages}
        pathname="/buscar/[term]/page/[page]"
        params={{ term }}
      />
    </main>
  );
}
