import { unstable_cache } from "next/cache";
import { cache } from "react";
import {
  type CategoryTaxonomy,
  createCategoryTaxonomy,
} from "~/domain/entities/post/taxonomy";
import { createCategoryTaxonomyRepository } from "./factory";

/** Etiqueta de invalidación. La usará el CRUD de `/admin/catalogo` (slice 5). */
export const CATEGORY_TAXONOMY_TAG = "category-taxonomy";

/** El catálogo cambia por migración, no por minuto. */
const REVALIDATE_SECONDS = 60 * 60;

/**
 * El catálogo cacheado entre requests.
 *
 * Se cachea la **instantánea**, no la taxonomía indexada: el caché de datos de Next guarda JSON, y
 * un `Map` no sobrevive ese viaje.
 *
 * Se usa `unstable_cache` y no `"use cache"` a propósito: `"use cache"` exige activar
 * `cacheComponents`, que cambia la semántica de renderizado de toda la app (todo acceso dinámico
 * tendría que quedar dentro de un `Suspense`). Eso es una migración aparte, no un efecto colateral
 * de mover categorías a la base. El día que el repo adopte Cache Components, esto se sustituye.
 */
const loadSnapshot = unstable_cache(
  () => createCategoryTaxonomyRepository().loadSnapshot(),
  ["category-taxonomy"],
  { revalidate: REVALIDATE_SECONDS, tags: [CATEGORY_TAXONOMY_TAG] },
);

/**
 * El catálogo listo para consultar.
 *
 * `cache()` de React envuelve por fuera para deduplicar dentro de un mismo render: una página que
 * pinta 12 tarjetas más el selector resuelve etiquetas muchas veces, y todas comparten la misma
 * lectura y los mismos índices.
 */
export const getCategoryTaxonomy = cache(
  async (): Promise<CategoryTaxonomy> => {
    return createCategoryTaxonomy(await loadSnapshot());
  },
);
