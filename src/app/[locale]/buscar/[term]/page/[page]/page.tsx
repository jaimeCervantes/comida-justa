import CardForList from "~/infra/UI/components/CardForList/CardForList";
import Pagination from "~/infra/UI/components/Pagination";
import { mapPostsToCards } from "~/infra/UI/mappers/posts/mapPostsToCards";

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
  params: Promise<{ term: string; page: string }>;
}) {
  const { term, page } = await params;
  const pageInt = parseInt(page, 10);
  const pageSize = 6;
  const data = term
    ? await fetchResults(term, pageInt, pageSize)
    : { results: [], total: 0 };
  const cards = mapPostsToCards(data.results || []);
  const totalPages = Math.ceil((data.total || 0) / pageSize);

  return (
    <main>
      <h1 className="text-4xl font-extrabold mb-6 mt-4 text-gray-900 dark:text-gray-100">
        Resultados de búsqueda
      </h1>
      {term && (
        <div className="mb-8 text-lg text-gray-600 dark:text-gray-400">
          Mostrando resultados para:{" "}
          <span className="font-bold text-pw-green">{term}</span>
        </div>
      )}
      {term && cards.length === 0 && (
        <div className="text-xl text-gray-500 text-center py-20">
          No se encontraron resultados para tu búsqueda.
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
        basePath={`/search/${encodeURIComponent(term)}/page`}
      />
    </main>
  );
}
