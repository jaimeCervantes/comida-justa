import {
  categoryKeysForPublicationPillar,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";

export async function categoryKeysForActivePublicationPillar(
  currentPillar: PublicationPillar | null,
): Promise<readonly string[] | undefined> {
  if (!currentPillar) return undefined;

  return categoryKeysForPublicationPillar(
    await getCategoryTaxonomy(),
    currentPillar,
  );
}
