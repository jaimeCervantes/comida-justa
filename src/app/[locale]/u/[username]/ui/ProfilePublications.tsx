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

export default function ProfilePublications({
  publications,
  username,
  currentPage,
  totalPages,
  viewerId,
  currentPillar,
}: {
  publications: Post[];
  username: string;
  currentPage: number;
  totalPages: number;
  currentPillar: PublicationPillar | null;
  /** Quién mira: decide si sus propias publicaciones le ofrecen editar y marcar agotado. */
  viewerId?: string | null;
}) {
  const t = useTranslations("profile");
  const pillarT = useTranslations("publicationPillars");
  if (publications.length === 0) {
    return (
      <>
        <PublicationPillarFilter
          currentPillar={currentPillar}
          pathname="/u/[username]"
          params={{ username }}
        />
        <p data-testid="profile-empty" className="pt-4">
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
        pathname="/u/[username]"
        params={{ username }}
      />
      <section
        data-testid="profile-publications"
        className={`${CARD_MASONRY} pt-2`}
      >
        {publications.map((post: Post) => (
          <CardForList {...post} viewerId={viewerId} key={post.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/u/[username]/page/[page]"
        params={{ username }}
        query={
          currentPillar
            ? { [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar }
            : undefined
        }
      />
    </>
  );
}
