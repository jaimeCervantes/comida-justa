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

type CategoryPostsProps = {
  posts: Post[];
  categoryKey: string;
  label: string;
  currentPage: number;
  totalPages: number;
  currentPillar: PublicationPillar | null;
};

export default function CategoryPosts({
  posts,
  categoryKey,
  label,
  currentPage,
  totalPages,
  viewerId,
  currentPillar,
}: CategoryPostsProps & { viewerId?: string | null }) {
  const t = useTranslations("category");
  const pillarT = useTranslations("publicationPillars");

  if (posts.length === 0) {
    return (
      <>
        <PublicationPillarFilter
          currentPillar={currentPillar}
          pathname="/categoria/[key]"
          params={{ key: categoryKey }}
        />
        <p data-testid="category-empty" className="pt-4">
          {publicationPillarEmptyMessage({
            currentPillar,
            fallback: t("empty", { category: label }),
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
        pathname="/categoria/[key]"
        params={{ key: categoryKey }}
      />
      <section data-testid="category-grid" className={`${CARD_MASONRY} pt-6`}>
        {posts.map((post: Post) => (
          <CardForList {...post} viewerId={viewerId} key={post.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/categoria/[key]/page/[page]"
        params={{ key: categoryKey }}
        query={
          currentPillar
            ? { [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar }
            : undefined
        }
      />
    </>
  );
}
