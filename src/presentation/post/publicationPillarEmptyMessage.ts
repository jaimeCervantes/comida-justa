import type { PublicationPillar } from "~/domain/entities/post/publicationPillars";

type Translation = (
  key: "empty" | PublicationPillar,
  values?: { pillar: string },
) => string;

export function publicationPillarEmptyMessage({
  currentPillar,
  fallback,
  t,
}: {
  currentPillar: PublicationPillar | null;
  fallback: string;
  t: Translation;
}): string {
  if (!currentPillar) return fallback;

  return t("empty", { pillar: t(currentPillar) });
}
