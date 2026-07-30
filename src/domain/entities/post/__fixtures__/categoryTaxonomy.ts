import {
  createCategoryTaxonomy,
  type CategoryTaxonomy,
  type CategoryTaxonomySnapshot,
} from "../taxonomy";
import { FALLBACK_CATEGORY_TAXONOMY } from "../taxonomyFallback";

/**
 * El catálogo tal como lo siembra la migración `0026`, alias incluidos.
 *
 * El fallback no los trae —solo sirven a la búsqueda, que vive en SQL— pero las pruebas del
 * dominio sí tienen que ejercer la resolución permisiva, así que aquí se completan.
 */
const SEEDED_ALIASES: ReadonlyArray<[alias: string, categoryKey: string]> = [
  ["comidas", "platillos"],
  ["pan", "panaderia"],
  ["panes", "panaderia"],
  ["bread", "panaderia"],
  ["zumo", "jugos"],
  ["juice", "jugos"],
  ["cremas", "untables"],
  ["food", "alimentacion"],
];

export const SEEDED_TAXONOMY_SNAPSHOT: CategoryTaxonomySnapshot = {
  nodes: FALLBACK_CATEGORY_TAXONOMY.nodes,
  aliases: SEEDED_ALIASES.map(([alias, categoryKey]) => ({
    aliasNormalized: alias,
    categoryKey,
  })),
};

export function makeTaxonomy(
  overrides: Partial<CategoryTaxonomySnapshot> = {},
): CategoryTaxonomy {
  return createCategoryTaxonomy({ ...SEEDED_TAXONOMY_SNAPSHOT, ...overrides });
}

/** El mismo catálogo con una clave desactivada, para probar que deja de ofrecerse. */
export function makeTaxonomyWithInactive(inactiveKey: string): CategoryTaxonomy {
  return makeTaxonomy({
    nodes: SEEDED_TAXONOMY_SNAPSHOT.nodes.map((node) =>
      node.key === inactiveKey ? { ...node, isActive: false } : node,
    ),
  });
}
