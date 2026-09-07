import type { PillarCategoryKey } from "~/domain/entities/post/publicationPillars";
import type { PillarKey } from "~/domain/pillars/pillarKey";

const CATEGORY_BY_PRACTICE_PILLAR: Record<PillarKey, PillarCategoryKey> = {
  sleep: "sueno_y_descanso",
  nutrition: "alimentacion",
  movement: "movimiento_y_ejercicio",
  mindSpirit: "mente_y_espiritu",
};

export function categoryKeyForPracticePillar(
  pillar: PillarKey,
): PillarCategoryKey {
  return CATEGORY_BY_PRACTICE_PILLAR[pillar];
}

export function practiceEvidenceSlug(practiceKey: string, date: Date): string {
  const timestamp = date.toISOString().replace(/\D/g, "").slice(0, 14);
  return `practica-${practiceKey}-${timestamp}`;
}
