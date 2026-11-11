import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  listingFilterParams,
  parseListingFilters,
} from "~/domain/entities/post/listingFilters";
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
import { filteredEmptyMessage } from "~/presentation/post/ListingFilters/filteredEmptyMessage";
import ListingFilterBar from "~/presentation/post/ListingFilters/ListingFilterBar";
import { publicationPillarEmptyMessage } from "~/presentation/post/publicationPillarEmptyMessage";
import { SEARCH_PAGE_SIZE, searchPosts } from "./data";
import SearchSummary from "./ui/SearchSummary";

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
  searchParams: Promise<{
    q?: string;
    page?: string;
    pillar?: string;
    disponibles?: string;
    promocion?: string;
  }>;
  params: Promise<{ locale: string }>;
}) {
  const rawSearchParams = await searchParams;
  const { q = "", page = "1" } = rawSearchParams;
  /* Las facetas viven en la dirección, así que se comparten, se guardan y vuelven con el botón de
     atrás. */
  const filters = parseListingFilters(rawSearchParams);
  const { currentPillar } = filters;
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("search");
  const pillarT = await getTranslations("publicationPillars");
  const filtersT = await getTranslations("listingFilters");
  const pageInt = parseInt(page || "1", 10);
  const data = await searchPosts(
    q,
    pageInt,
    locale,
    currentPillar,
    filters.onlyAvailable,
    filters.onSale,
  );
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

      {/* Cuántos son, y con qué filtros puestos. El 5.7 lo pone antes que nada: es lo que dice si
          hace falta afinar o soltar. */}
      {q ? (
        <SearchSummary
          query={q}
          total={data.total}
          filters={filters}
          isSemantic={data.strategy === "semantic"}
        />
      ) : null}

      {/* Los filtros arriba y no al lado: como barra lateral se llevaban 264 px del ancho —dejaban
          los resultados en 952 y las tarjetas en 306— y unos 360 px de alto en el teléfono, que
          había que recorrer antes de ver el primer resultado. Ver el slice 1 de
          `docs/features/platform/039-2026-09-10-listados-compactos.md`. */}
      <div className="mt-4">
        {/* Las facetas solo tienen sentido con algo que filtrar. Son la barra de todos los listados;
            lo que la búsqueda añade —las cuentas por pilar— viaja como prop. Sin deslizador de
            distancia a propósito: esconder algo que alguien pidió por su nombre sería el peor fallo
            posible; la distancia desempata el orden, no recorta la lista. */}
        {q ? (
          <ListingFilterBar
            pathname="/buscar"
            query={{ q }}
            filters={filters}
            counts={data.counts}
            testIdPrefix="facet"
            testId="search-facets"
            ariaLabel={t("facetsLabel")}
          />
        ) : null}

        {q && cards.length === 0 && (
          <EmptyState
            testId="search-empty"
            className="mt-6"
            title={
              filteredEmptyMessage(filters, filtersT) ??
              publicationPillarEmptyMessage({
                currentPillar,
                fallback: t("noResults"),
                t: pillarT,
              })
            }
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
        <section
          data-testid="search-results"
          className={`${CARD_MASONRY} pt-6`}
        >
          {cards.map((card) => (
            <CardForList key={card.id} {...card} viewerId={viewerId} />
          ))}
        </section>
      </div>
      <Pagination
        currentPage={pageInt}
        totalPages={totalPages}
        pathname="/buscar"
        pageQueryParam="page"
        /* Las facetas viajan con la paginación: sin ellas, pasar de página soltaba el filtro y la
           página 2 enseñaba resultados que la 1 había escondido. */
        query={{ q, ...listingFilterParams(filters) }}
      />
    </>
  );
}
