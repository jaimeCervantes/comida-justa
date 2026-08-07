import { useTranslations } from "next-intl";
import type { Post } from "~/infra/types/Posts";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";

type CategoryPostsProps = {
  posts: Post[];
  categoryKey: string;
  label: string;
  currentPage: number;
  totalPages: number;
};

export default function CategoryPosts({
  posts,
  categoryKey,
  label,
  currentPage,
  totalPages,
  viewerId,
}: CategoryPostsProps & { viewerId?: string | null }) {
  const t = useTranslations("category");

  if (posts.length === 0) {
    return (
      <p data-testid="category-empty">{t("empty", { category: label })}</p>
    );
  }

  return (
    <>
      <section
        data-testid="category-grid"
        className="grid grid-flow-dense gap-4 pt-6 max-sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
      >
        {posts.map((post: Post) => (
          <CardForList {...post} viewerId={viewerId} key={post.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/categoria/[key]/page/[page]"
        params={{ key: categoryKey }}
      />
    </>
  );
}
