import CardForList from "~/infra/UI/components/CardForList/CardForList";
import Pagination from "~/infra/UI/components/Pagination";
import { mapPostsToCards } from "~/infra/UI/mappers/posts/mapPostsToCards";

async function fetchResults(
  q: string,
  page: number,
  pageSize: number,
  locale: string,
) {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || ""
    }/api/search?q=${encodeURIComponent(
      q,
    )}&limit=${pageSize}&page=${page}&locale=${locale}`,
  );
  return res.json();
}

export default async function SearchPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { q = "", page = "1" } = await searchParams;
  const { locale } = await params;
  const pageInt = parseInt(page, 10);
  const pageSize = 6;
  const data = q
    ? await fetchResults(q, pageInt, pageSize, locale)
    : { results: [], total: 0 };
  const cards = mapPostsToCards(data.results || []);
  const totalPages = Math.ceil((data.total || 0) / pageSize);

  return (
    <>
      <h1 className="text-2xl font-bold my-4">Resultados de búsqueda</h1>
      {q && (
        <div className="mb-4 text-gray-600">
          Mostrando resultados para:{" "}
          <span className="font-semibold text-pw-green">
            {decodeURIComponent(q)}
          </span>
        </div>
      )}
      {q && cards.length === 0 && <div>No se encontraron resultados.</div>}
      <section className="grid grid-flow-dense gap-4 pt-6 max-sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {cards.map((card) => (
          <CardForList key={card.id} {...card} />
        ))}
      </section>
      {/* Pagination */}
      <Pagination
        currentPage={pageInt}
        totalPages={totalPages}
        basePath={`/${locale}/search/${q}/page`}
      />
    </>
  );
}
