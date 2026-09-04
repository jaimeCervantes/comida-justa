import { useTranslations } from "next-intl";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import type { Post } from "~/infra/types/Posts";
import { CARD_MASONRY } from "~/presentation/design_system/surfaces/cardList";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";
import PublicationPillarFilter from "~/presentation/post/PublicationPillarFilter";
import { publicationPillarEmptyMessage } from "~/presentation/post/publicationPillarEmptyMessage";
import StoreSearchField from "./StoreSearchField";

export default function StoreCatalog({
  catalog,
  handle,
  currentPage,
  totalPages,
  viewerId,
  viewerSellerId,
  currentPillar,
  term,
}: {
  catalog: Post[];
  handle: string;
  currentPage: number;
  totalPages: number;
  currentPillar: PublicationPillar | null;
  /** Lo que se está buscando ahora mismo, ya normalizado. Vacío = no se está filtrando. */
  term: string;
  /** Quién mira: decide si sus propias publicaciones le ofrecen editar y marcar agotado. */
  viewerId?: string | null;
  /**
   * La tienda de quien mira, cuando es **ésta**.
   *
   * Es la segunda vía de `canManagePost`: su dueño lleva el inventario de todo el catálogo, lo
   * escribiera quien lo escribiera. Nulo para cualquier visitante, incluido el dueño de otra tienda.
   */
  viewerSellerId?: string | null;
}) {
  const t = useTranslations("store");
  const pillarT = useTranslations("publicationPillars");
  if (catalog.length === 0) {
    return (
      <>
        <StoreSearchField
          handle={handle}
          term={term}
          currentPillar={currentPillar}
        />
        <PublicationPillarFilter
          currentPillar={currentPillar}
          pathname="/tienda/[slug]"
          params={{ slug: handle }}
        />
        <p data-testid="store-empty" className="pt-4">
          {/* Buscar y no encontrar no es lo mismo que una tienda sin catálogo: lo primero se
              arregla borrando el término y lo segundo publicando. */}
          {term
            ? t("nothingFound")
            : publicationPillarEmptyMessage({
                currentPillar,
                fallback: t("empty"),
                t: pillarT,
              })}
        </p>
      </>
    );
  }

  return (
    <>
      <StoreSearchField
        handle={handle}
        term={term}
        currentPillar={currentPillar}
      />
      <PublicationPillarFilter
        currentPillar={currentPillar}
        pathname="/tienda/[slug]"
        params={{ slug: handle }}
      />
      <section data-testid="store-catalog" className={CARD_MASONRY}>
        {catalog.map((post: Post) => (
          <CardForList
            {...post}
            viewerId={viewerId}
            viewerSellerId={viewerSellerId}
            key={post.id}
          />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/tienda/[slug]/page/[page]"
        params={{ slug: handle }}
        /* Los dos filtros viajan con la página: pasar a la siguiente no puede tirar lo que se
           estaba mirando, ni el pilar ni la búsqueda. */
        query={{
          ...(currentPillar
            ? { [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar }
            : {}),
          ...(term ? { q: term } : {}),
        }}
      />
    </>
  );
}
