import { type CategoryTaxonomy, subtreeKeys } from "./taxonomy";

export const PUBLICATION_PILLAR_QUERY_PARAM = "pillar";

export type PublicationPillar =
  | "sleep"
  | "nutrition"
  | "movement"
  | "mindSpirit";

export type PillarCategoryKey =
  | "sueno_y_descanso"
  | "alimentacion"
  | "movimiento_y_ejercicio"
  | "mente_y_espiritu";

export interface PublicationPillarOption {
  key: PublicationPillar;
  categoryKey: PillarCategoryKey;
  /**
   * El número del pilar, del 1 al 4.
   *
   * No es el índice del array disfrazado: es parte de cómo la marca los nombra —«1 · Sueño»,
   * «2 · Alimentación»— y así están rotulados en `tokens/colors.css` desde el slice 3. Estaba
   * implícito en el orden de esta lista, que es la peor forma de guardar un dato: cualquiera que
   * reordene por gusto renumera los cuatro pilares sin enterarse.
   *
   * Se hace explícito porque la interfaz lo necesita. `pillarPalette.contrast.test.ts` dejó escrito
   * que Movimiento y Mente contrastan 1.14 entre sí como tinta: el color no puede ir solo, y el
   * número es lo que lo acompaña.
   */
  number: 1 | 2 | 3 | 4;
}

export const PUBLICATION_PILLARS: readonly PublicationPillarOption[] = [
  { key: "sleep", categoryKey: "sueno_y_descanso", number: 1 },
  { key: "nutrition", categoryKey: "alimentacion", number: 2 },
  { key: "movement", categoryKey: "movimiento_y_ejercicio", number: 3 },
  { key: "mindSpirit", categoryKey: "mente_y_espiritu", number: 4 },
];

const CATEGORY_KEY_BY_PILLAR: Record<PublicationPillar, PillarCategoryKey> = {
  sleep: "sueno_y_descanso",
  nutrition: "alimentacion",
  movement: "movimiento_y_ejercicio",
  mindSpirit: "mente_y_espiritu",
};

const PILLARS = new Set<PublicationPillar>(
  PUBLICATION_PILLARS.map(({ key }) => key),
);

export function parsePublicationPillar(
  candidate: string | null | undefined,
): PublicationPillar | null {
  return candidate && PILLARS.has(candidate as PublicationPillar)
    ? (candidate as PublicationPillar)
    : null;
}

export function categoryKeyForPublicationPillar(
  pillar: PublicationPillar,
): PillarCategoryKey {
  return CATEGORY_KEY_BY_PILLAR[pillar];
}

const PILLAR_BY_CATEGORY_KEY: Record<PillarCategoryKey, PublicationPillar> =
  Object.fromEntries(
    PUBLICATION_PILLARS.map(({ key, categoryKey }) => [categoryKey, key]),
  ) as Record<PillarCategoryKey, PublicationPillar>;

const PILLAR_NUMBER: Record<PublicationPillar, 1 | 2 | 3 | 4> =
  Object.fromEntries(
    PUBLICATION_PILLARS.map(({ key, number }) => [key, number]),
  ) as Record<PublicationPillar, 1 | 2 | 3 | 4>;

/**
 * A qué pilar pertenece una publicación, a partir de su categoría raíz.
 *
 * Es la vuelta de `categoryKeyForPublicationPillar`, y la necesita la tarjeta: el 5.2 pone la
 * insignia del pilar **encima de la foto**, y hasta ahora la tarjeta solo sabía su categoría.
 * Devuelve `null` para una categoría que no cuelga de ninguno de los cuatro —o para una
 * publicación sin categoría, que en la base son los anuncios—, y ahí no se pinta insignia en vez
 * de inventar un pilar.
 */
export function publicationPillarForCategory(
  category: string | null | undefined,
): PublicationPillar | null {
  if (!category) return null;

  return PILLAR_BY_CATEGORY_KEY[category as PillarCategoryKey] ?? null;
}

/** El número con el que la marca nombra al pilar. El color nunca puede ir solo. */
export function publicationPillarNumber(
  pillar: PublicationPillar,
): 1 | 2 | 3 | 4 {
  return PILLAR_NUMBER[pillar];
}

export function categoryKeysForPublicationPillar(
  taxonomy: CategoryTaxonomy,
  pillar: PublicationPillar | null,
): readonly string[] | undefined {
  if (!pillar) return undefined;

  return subtreeKeys(taxonomy, categoryKeyForPublicationPillar(pillar));
}
