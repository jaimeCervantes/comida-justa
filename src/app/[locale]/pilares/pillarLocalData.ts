import { cache } from "react";
import { labelFor, subtreeKeys } from "~/domain/entities/post/taxonomy";
import type { StoreSummary } from "~/domain/entities/seller/directory";
import type {
  HabitChallengeExperienceKey,
  PillarCategoryKey,
} from "~/domain/habits/habitChallengeExperiences";
import { HABIT_CHALLENGE_EXPERIENCES } from "~/domain/habits/habitChallengeExperiences";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { listStoresByCategory } from "~/infra/dataAccess/sellers/PostgresStoreDirectory";
import { readViewerLocationContext } from "~/infra/location/viewerLocationContext";
import type { Post } from "~/infra/types/Posts";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";

/**
 * Cuánto se enseña de la zona sin tapar el ritual.
 *
 * **Literales, y no `PAGINATION_PAGE_SIZE` a propósito.** Esa constante sale del entorno, y CI corre
 * sin ningún `.env`: allí vale 4 y en una máquina con `.env.development` vale 9. Un bloque que la
 * usara afirmaría conteos distintos según dónde corriera, y su escenario fallaría siempre en GitHub
 * y nunca en la máquina de quien lo escribió. Aquí el número es una decisión de diseño —la sección
 * es un aperitivo con enlace al catálogo completo, no el catálogo—, así que se escribe.
 */
const PILLAR_LOCAL_POSTS_LIMIT = 4;
const PILLAR_LOCAL_STORES_LIMIT = 3;

export type PillarLocalData = {
  /** La clave de la categoría del pilar: es a dónde lleva el enlace de "ver todo". */
  categoryKey: PillarCategoryKey;
  /** La etiqueta del catálogo ya resuelta en el idioma pedido. */
  categoryLabel: string;
  posts: Post[];
  stores: readonly StoreSummary[];
};

/**
 * Lo que hay cerca para practicar un pilar: qué se compra y a quién.
 *
 * Las cuatro raíces de `categories` **son** los cuatro pilares, así que esto no necesitó modelo
 * nuevo ni migración: es la clave del pilar, su subárbol y las dos consultas que ya existían. Pedir
 * el subárbol y no la clave suelta es lo que hace que Alimentación traiga también sus jugos y su
 * panadería.
 *
 * Memorizado por petición como `listDirectory` y `getPostsByCategory`: la sección la piden la página
 * del pilar y nadie más hoy, pero la taxonomía y la ubicación son las mismas lecturas que ya hace el
 * resto del árbol y no tiene sentido repetirlas.
 *
 * **Nunca devuelve `null`.** Una categoría del catálogo que no responde es un fallo de despliegue,
 * no un 404 del pilar: la página del pilar existe por su ritual, y quedarse sin sección local es
 * degradar, no romper. Por eso el vacío se trata como vacío y lo cuenta la UI.
 */
export const readPillarLocal = cache(async function readPillarLocal(
  challenge: HabitChallengeExperienceKey,
  locale: string,
): Promise<PillarLocalData> {
  const { categoryKey } = HABIT_CHALLENGE_EXPERIENCES[challenge];
  const taxonomy = await getCategoryTaxonomy();
  const keys = subtreeKeys(taxonomy, categoryKey);
  const { visitor } = await readViewerLocationContext();

  const [postsResult, stores] = await Promise.all([
    createPostQueryRepository().getPostsByCategory(
      keys,
      1,
      PILLAR_LOCAL_POSTS_LIMIT,
      visitor,
    ),
    listStoresByCategory(keys, PILLAR_LOCAL_STORES_LIMIT, visitor),
  ]);

  return {
    categoryKey,
    categoryLabel: labelFor(taxonomy, categoryKey, locale) ?? categoryKey,
    posts: await mapPostsToCardsForLocale(postsResult.posts, locale),
    stores,
  };
});
