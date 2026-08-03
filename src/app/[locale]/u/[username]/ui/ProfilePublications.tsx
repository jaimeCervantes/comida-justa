import { useTranslations } from "next-intl";
import type { Post } from "~/infra/types/Posts";
import CardForList from "~/infra/UI/components/CardForList/CardForList";
import Pagination from "~/infra/UI/components/Pagination";

export default function ProfilePublications({
  publications,
  username,
  currentPage,
  totalPages,
  viewerId,
}: {
  publications: Post[];
  username: string;
  currentPage: number;
  totalPages: number;
  /** Quién mira: decide si sus propias publicaciones le ofrecen editar y marcar agotado. */
  viewerId?: string | null;
}) {
  const t = useTranslations("profile");
  if (publications.length === 0) {
    return <p data-testid="profile-empty">{t("empty")}</p>;
  }

  return (
    <>
      <section
        data-testid="profile-publications"
        className="grid grid-flow-dense gap-4 pt-2 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
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
      />
    </>
  );
}
