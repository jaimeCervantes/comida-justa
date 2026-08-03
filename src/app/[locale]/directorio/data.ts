import { cache } from "react";
import type {
  DirectoryKind,
  DirectoryPage,
} from "~/domain/entities/seller/directory";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import { listStores } from "~/infra/dataAccess/sellers/PostgresStoreDirectory";
import { readVisitorLocation } from "~/infra/location/visitorLocation";

/**
 * El directorio de una sección.
 *
 * Memorizado por petición porque lo piden dos: `generateMetadata`, que necesita saber si está vacío
 * para pedir `noindex`, y la página. Es la misma razón por la que `getPostDetails` lo está.
 */
export const listDirectory = cache(async function listDirectory(
  kind: DirectoryKind,
  page: number = PAGINATION_INIT_PAGE,
): Promise<DirectoryPage> {
  return listStores(
    kind,
    Math.max(PAGINATION_INIT_PAGE, page),
    PAGINATION_PAGE_SIZE,
    await readVisitorLocation(),
  );
});
