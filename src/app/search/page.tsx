import React from "react";
import CardForList from "../../infrastructure/UI/components/CardForList/CardForList";
import { mapPostsToCards } from "../../infrastructure/UI/mappers/posts/mapPostsToCards";

async function fetchResults(q: string, page: number, pageSize: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/search?q=${encodeURIComponent(q)}&limit=${pageSize}&page=${page}`);
  return res.json();
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const q = searchParams.q || "";
  const page = parseInt(searchParams.page || "1", 10);
  const pageSize = 10;
  const data = q ? await fetchResults(q, page, pageSize) : { results: [], total: 0 };
  const cards = mapPostsToCards(data.results || []);

  return (
    <>
      <h1 className="text-2xl font-bold my-4">Resultados de búsqueda</h1>
      {q && (
        <div className="mb-4 text-gray-600">
          Mostrando resultados para: <span className="font-semibold text-pw-green">{q}</span>
        </div>
      )}
      {q && cards.length === 0 && <div>No se encontraron resultados.</div>}
      <section className="grid grid-flow-dense gap-4 pt-6 max-sm:grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] sm:grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))]">
        {cards.map((card: any) => (
          <CardForList key={card.id} {...card} />
        ))}
      </section>
      {/* Pagination */}
      {data.total > pageSize && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.ceil(data.total / pageSize) }, (_, i) => (
            <a
              key={i}
              href={`/search?q=${encodeURIComponent(q)}&page=${i + 1}`}
              className={`px-3 py-1 rounded ${i + 1 === page ? "bg-pw-green text-white" : "text-pw-green"}`}
            >
              {i + 1}
            </a>
          ))}
        </div>
      )}
    </>
  );
} 