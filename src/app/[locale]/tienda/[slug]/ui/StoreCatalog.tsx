import { useTranslations } from "next-intl";
import type { Post } from "~/infra/types/Posts";
import CardForList from "~/infra/UI/components/CardForList/CardForList";
import Pagination from "~/infra/UI/components/Pagination";

export default function StoreCatalog({
  catalog,
  handle,
  currentPage,
  totalPages,
  viewerId,
}: {
  catalog: Post[];
  handle: string;
  currentPage: number;
  totalPages: number;
  /** Quién mira: decide si sus propias publicaciones le ofrecen editar y marcar agotado. */
  viewerId?: string | null;
}) {
  const t = useTranslations("store");
  if (catalog.length === 0) {
    return <p data-testid="store-empty">{t("empty")}</p>;
  }

  return (
    <>
      <section
        data-testid="store-catalog"
        className="grid grid-flow-dense gap-4 max-sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
      >
        {catalog.map((post: Post) => (
          <CardForList {...post} viewerId={viewerId} key={post.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/tienda/[slug]/page/[page]"
        params={{ slug: handle }}
      />
    </>
  );
}
