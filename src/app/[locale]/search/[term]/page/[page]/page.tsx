import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
import CardForList from "~/infra/UI/components/CardForList/CardForList";
import Pagination from "~/infra/UI/components/Pagination";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";

async function fetchResults(term: string, page: number, pageSize: number) {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || ""
    }/api/search?q=${encodeURIComponent(term)}&limit=${pageSize}&page=${page}`,
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
    ? await fetchResults(term, pageInt, pageSize)
    : { results: [], total: 0 };
  const cards = await mapPostsToCardsForLocale(data.results || [], locale);
  const totalPages = Math.ceil((data.total || 0) / pageSize);

  return (
    <main>
      <h1 className="text-2xl font-bold my-4">{t("resultsHeading")}</h1>
      {term && (
        <div className="mb-4 text-gray-600">
          Mostrando resultados para:{" "}
          <span className="font-semibold text-pw-green">
            {decodeURIComponent(term)}
          </span>
        </div>
      )}
      {term && cards.length === 0 && <div>No se encontraron resultados.</div>}
      <section className="grid grid-flow-dense gap-4 pt-6 max-sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {cards.map((card) => (
          <CardForList key={card.id} {...card} />
        ))}
      </section>
      <Pagination
        currentPage={pageInt}
        totalPages={totalPages}
        basePath={`/search/${term}/page`}
      />
    </main>
  );
}
