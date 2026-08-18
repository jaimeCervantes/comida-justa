import type { PublicationPillar } from "~/domain/entities/post/publicationPillars";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import { measuredFrom } from "./measuredFrom";

export function homeFeedKey(
  visitor: Coordinates | null,
  currentPillar: PublicationPillar | null,
): string {
  return `${measuredFrom(visitor)}:${currentPillar ?? "all"}`;
}
