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

export function categoryKeysForPublicationPillar(
  taxonomy: CategoryTaxonomy,
  pillar: PublicationPillar | null,
): readonly string[] | undefined {
  if (!pillar) return undefined;

  return subtreeKeys(taxonomy, categoryKeyForPublicationPillar(pillar));
}
