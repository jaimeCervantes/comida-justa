import { useTranslations } from "next-intl";
import type { Post } from "~/infra/types/Posts";
import CardForList from "~/infra/UI/components/CardForList/CardForList";
import Pagination from "~/infra/UI/components/Pagination";
import { profilePath } from "../../../cuenta/profilePath";

export default function ProfilePublications({
  publications,
  username,
  currentPage,
  totalPages,
}: {
  publications: Post[];
  username: string;
  currentPage: number;
  totalPages: number;
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
          <CardForList {...post} key={post.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`${profilePath(username)}/page`}
      />
    </>
  );
}
