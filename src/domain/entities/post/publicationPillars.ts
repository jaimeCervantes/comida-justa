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
}

export const PUBLICATION_PILLARS: readonly PublicationPillarOption[] = [
  { key: "sleep", categoryKey: "sueno_y_descanso" },
  { key: "nutrition", categoryKey: "alimentacion" },
  { key: "movement", categoryKey: "movimiento_y_ejercicio" },
  { key: "mindSpirit", categoryKey: "mente_y_espiritu" },
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
