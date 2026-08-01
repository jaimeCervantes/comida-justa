import type { Post } from "~/infra/types/Posts";
import CardForList from "~/infra/UI/components/CardForList/CardForList";
import Pagination from "~/infra/UI/components/Pagination";
import { storePath } from "../../../cuenta/storePath";

export const STORE_EMPTY_MESSAGE = "Esta tienda todavía no ha publicado nada.";

export default function StoreCatalog({
  catalog,
  handle,
  currentPage,
  totalPages,
}: {
  catalog: Post[];
  handle: string;
  currentPage: number;
  totalPages: number;
}) {
  if (catalog.length === 0) {
    return <p data-testid="store-empty">{STORE_EMPTY_MESSAGE}</p>;
  }

  return (
    <>
      <section
        data-testid="store-catalog"
        className="grid grid-flow-dense gap-4 pt-6 max-sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
      >
        {catalog.map((post: Post) => (
          <CardForList {...post} key={post.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`${storePath(handle)}/page`}
      />
    </>
  );
}
