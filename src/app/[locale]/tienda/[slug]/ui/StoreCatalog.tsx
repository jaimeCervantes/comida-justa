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

export default function StoreCatalog({
  catalog,
  handle,
  currentPage,
  totalPages,
  viewerId,
  currentPillar,
}: {
  catalog: Post[];
  handle: string;
  currentPage: number;
  totalPages: number;
  currentPillar: PublicationPillar | null;
  /** Quién mira: decide si sus propias publicaciones le ofrecen editar y marcar agotado. */
  viewerId?: string | null;
}) {
  const t = useTranslations("store");
  const pillarT = useTranslations("publicationPillars");
  if (catalog.length === 0) {
    return (
      <>
        <PublicationPillarFilter
          currentPillar={currentPillar}
          pathname="/tienda/[slug]"
          params={{ slug: handle }}
        />
        <p data-testid="store-empty" className="pt-4">
          {publicationPillarEmptyMessage({
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
      <PublicationPillarFilter
        currentPillar={currentPillar}
        pathname="/tienda/[slug]"
        params={{ slug: handle }}
      />
      <section data-testid="store-catalog" className={CARD_MASONRY}>
        {catalog.map((post: Post) => (
          <CardForList {...post} viewerId={viewerId} key={post.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/tienda/[slug]/page/[page]"
        params={{ slug: handle }}
        query={
          currentPillar
            ? { [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar }
            : undefined
        }
      />
    </>
  );
}
