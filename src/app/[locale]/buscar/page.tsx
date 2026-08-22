import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  parsePublicationPillar,
} from "~/domain/entities/post/publicationPillars";
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
import { publicationPillarEmptyMessage } from "~/presentation/post/publicationPillarEmptyMessage";
import { SEARCH_PAGE_SIZE, searchPosts } from "./data";
import SearchFacets, { ONLY_AVAILABLE_PARAM } from "./ui/SearchFacets";
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
  }>;
  params: Promise<{ locale: string }>;
}) {
  const { q = "", page = "1", pillar, disponibles } = await searchParams;
  /* La faceta vive en la dirección, así que se comparte, se guarda y vuelve con el botón de atrás.
     Cualquier valor la enciende: es un interruptor, no un dato. */
  const onlyAvailable = Boolean(disponibles);
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const currentPillar = parsePublicationPillar(pillar);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("search");
  const pillarT = await getTranslations("publicationPillars");
  const pageInt = parseInt(page || "1", 10);
  const data = await searchPosts(
    q,
    pageInt,
    locale,
    currentPillar,
    onlyAvailable,
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
          currentPillar={currentPillar}
          onlyAvailable={onlyAvailable}
          isSemantic={data.strategy === "semantic"}
        />
      ) : null}

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:items-start">
        {/* Las facetas solo tienen sentido con algo que filtrar. */}
        {q ? (
          <SearchFacets
            query={q}
            currentPillar={currentPillar}
            onlyAvailable={onlyAvailable}
            counts={data.counts}
          />
        ) : null}

        <div>
          {q && cards.length === 0 && (
            <EmptyState
              testId="search-empty"
              title={publicationPillarEmptyMessage({
                currentPillar,
                fallback: t("noResults"),
                t: pillarT,
              })}
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
          <section className={`${CARD_MASONRY} pt-6`}>
            {cards.map((card) => (
              <CardForList key={card.id} {...card} viewerId={viewerId} />
            ))}
          </section>
        </div>
      </div>
      <Pagination
        currentPage={pageInt}
        totalPages={totalPages}
        pathname="/buscar"
        pageQueryParam="page"
        /* La faceta de existencias viaja con la paginación: sin ella, pasar de página soltaba el
           filtro y la página 2 enseñaba resultados que la 1 había escondido. */
        query={{
          q,
          [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar ?? undefined,
          [ONLY_AVAILABLE_PARAM]: onlyAvailable ? "1" : undefined,
        }}
      />
    </>
  );
}
