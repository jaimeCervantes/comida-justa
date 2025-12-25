import React from "react";
import CardForList from "~/infrastructure/UI/components/CardForList/CardForList";
import { mapPostsToCards } from "~/infrastructure/UI/mappers/posts/mapPostsToCards";
import Pagination from "~/infrastructure/UI/components/Pagination";

async function fetchResults(term: string, page: number, pageSize: number) {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || ""
    }/api/search?q=${encodeURIComponent(term)}&limit=${pageSize}&page=${page}`
  );
  return res.json();
}

export default async function SearchPage({
  params,
}: {
  params: Promise<{ term: string; page: string }>;
}) {
  const { term, page } = await params;
  const pageInt = parseInt(page);
  const pageSize = 10;
  const data = term
    ? await fetchResults(term, pageInt, pageSize)
    : { results: [], total: 0 };
  const cards = mapPostsToCards(data.results || []);
  const totalPages = Math.ceil((data.total || 0) / pageSize);

  return (
    <main>
      <h1 className="text-2xl font-bold my-4">Resultados de búsqueda</h1>
      {term && (
        <div className="mb-4 text-gray-600">
          Mostrando resultados para:{" "}
          <span className="font-semibold text-pw-green">{term}</span>
        </div>
      )}
      {term && cards.length === 0 && <div>No se encontraron resultados.</div>}
      <section className="grid grid-flow-dense gap-4 pt-6 max-sm:grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] sm:grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))]">
        {cards.map((card: any) => (
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
