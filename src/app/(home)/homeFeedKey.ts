import type { PublicationPillar } from "~/domain/entities/post/publicationPillars";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import { measuredFrom } from "./measuredFrom";

export function homeFeedKey(
  visitor: Coordinates | null,
  currentPillar: PublicationPillar | null,
  /** `?disponibles=1`: otro filtro, otra lista; lo acumulado con el anterior no sirve. */
  onlyAvailable = false,
): string {
  return `${measuredFrom(visitor)}:${currentPillar ?? "all"}:${onlyAvailable ? "in-stock" : "any"}`;
}
