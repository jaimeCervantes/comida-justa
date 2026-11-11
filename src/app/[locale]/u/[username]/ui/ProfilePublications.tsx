import { useTranslations } from "next-intl";
import { ONLY_AVAILABLE_QUERY_PARAM } from "~/domain/entities/post/catalogFilters";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import type { Post } from "~/infra/types/Posts";
import { CARD_MASONRY } from "~/presentation/design_system/surfaces/cardList";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";
import ListingFilterBar from "~/presentation/post/ListingFilters/ListingFilterBar";
import { listingQuery } from "~/presentation/post/ListingFilters/listingQuery";
import { publicationPillarEmptyMessage } from "~/presentation/post/publicationPillarEmptyMessage";

export default function ProfilePublications({
  publications,
  username,
  currentPage,
  totalPages,
  viewerId,
  currentPillar,
  onlyAvailable = false,
}: {
  publications: Post[];
  username: string;
  currentPage: number;
  totalPages: number;
  currentPillar: PublicationPillar | null;
  /** `?disponibles=1`: deja fuera los productos agotados; anuncios y eventos no se agotan. */
  onlyAvailable?: boolean;
  /** Quién mira: decide si sus propias publicaciones le ofrecen editar y marcar agotado. */
  viewerId?: string | null;
}) {
  const t = useTranslations("profile");
  const filtersT = useTranslations("listingFilters");
  const pillarT = useTranslations("publicationPillars");
  const params = { username };
  const filters = (
    <ListingFilterBar
      pathname="/u/[username]"
      params={params}
      currentPillar={currentPillar}
      onlyAvailable={onlyAvailable}
      className="mt-4"
    />
  );

  if (publications.length === 0) {
    return (
      <>
        {filters}
        <p data-testid="profile-empty" className="pt-4">
          {onlyAvailable
            ? filtersT("nothingInStock")
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
      {filters}
      <section
        data-testid="profile-publications"
        className={`${CARD_MASONRY} pt-6`}
      >
        {publications.map((post: Post) => (
          <CardForList {...post} viewerId={viewerId} key={post.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/u/[username]/page/[page]"
        params={params}
        query={listingQuery({
          [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar,
          [ONLY_AVAILABLE_QUERY_PARAM]: onlyAvailable ? "1" : undefined,
        })}
      />
    </>
  );
}
