import { useTranslations } from "next-intl";
import type { Post } from "~/infra/types/Posts";
import { CARD_MASONRY } from "~/presentation/design_system/surfaces/cardList";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";

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
      />
    </>
  );
}
