import React from "react";
import CardForList from "~/infrastructure/UI/components/CardForList/CardForList";
import { mapPostsToCards } from "~/infrastructure/UI/mappers/posts/mapPostsToCards";
import Pagination from "~/infrastructure/UI/components/Pagination";

async function fetchResults(
  q: string,
  page: number,
  pageSize: number,
  locale: string
) {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || ""
    }/api/search?q=${encodeURIComponent(
      q
    )}&limit=${pageSize}&page=${page}&locale=${locale}`
  );
  return res.json();
}

export default async function SearchPage({
  searchParams,
  params,
}: {
  searchParams: { q?: string; page?: string };
  params: { locale: string };
}) {
  const q = (await searchParams).q || "";
  const pageAwaited = (await searchParams).page || "1";
  const locale = (await params).locale;
  const page = parseInt(pageAwaited, 10);
  const pageSize = 5;
  const data = q
    ? await fetchResults(q, page, pageSize, locale)
    : { results: [], total: 0 };
  const cards = mapPostsToCards(data.results || []);
  const totalPages = Math.ceil((data.total || 0) / pageSize);

  return (
    <>
      <h1 className="text-2xl font-bold my-4">Resultados de búsqueda</h1>
      {q && (
        <div className="mb-4 text-gray-600">
          Mostrando resultados para:{" "}
          <span className="font-semibold text-pw-green">{q}</span>
        </div>
      )}
      {q && cards.length === 0 && <div>No se encontraron resultados.</div>}
      <section className="grid grid-flow-dense gap-4 pt-6 max-sm:grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] sm:grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))]">
        {cards.map((card: any) => (
          <CardForList key={card.id} {...card} />
        ))}
      </section>
      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath={`/search/${encodeURIComponent(q)}/page`}
      />
    </>
  );
}
