import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";
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
  searchParams: Promise<{ q?: string; page?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { q = "", page = "1" } = await searchParams;
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("search");
  const pageInt = parseInt(page || "1", 10);
  const data = await searchPosts(q, pageInt, locale);
  const cards = await mapPostsToCardsForLocale(data.results, locale);
  const totalPages = Math.ceil(data.total / SEARCH_PAGE_SIZE);

  return (
    <>
      <h1 className="text-2xl font-bold my-4">{t("resultsHeading")}</h1>
      {q && (
        <div className="mb-4 text-gray-600">
          {t("showingResultsFor")}{" "}
          <span className="font-semibold text-pw-green">
            {/* `q` sale de `searchParams`, que Next ya entrega decodificado: volver a decodificar
                aquí **lanzaba** con un `%` suelto —buscar «50% descuento» tumbaba la página con un
                500— y no arreglaba nada, porque no había nada que decodificar. */}
            {q}
          </span>
        </div>
      )}
      {q && cards.length === 0 && <div>{t("noResults")}</div>}
      <section className="grid grid-flow-dense gap-4 pt-6 max-sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {cards.map((card) => (
          <CardForList key={card.id} {...card} viewerId={viewerId} />
        ))}
      </section>
      <Pagination
        currentPage={pageInt}
        totalPages={totalPages}
        pathname="/buscar/[term]/page/[page]"
        params={{ term: q }}
      />
    </>
  );
}
