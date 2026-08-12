import { cache } from "react";
import { createHabitCommunityRepository } from "~/infra/dataAccess/habits/PostgresHabitChallengeRepository";
import type { PublicHabitCelebration } from "~/use_cases/habits/ports/HabitChallengeRepository";

export const PUBLIC_CELEBRATION_LIST_LIMIT = 8;

/**
 * `limit` es cuántas celebraciones necesita quien llama, y se lo lleva la consulta: cada pantalla
 * pide las que va a pintar en vez de traer ocho y tirar el resto. Sin argumento se queda con
 * `PUBLIC_CELEBRATION_LIST_LIMIT`, que es el tamaño de la lista completa.
 *
 * El `slice` no sobra: el `limit` protege la consulta, y esto protege a quien la consume de un
 * adaptador que devuelva de más.
 */
export const readRecentPublicCelebrations = cache(
  async (
    viewerId?: string | null,
    limit: number = PUBLIC_CELEBRATION_LIST_LIMIT,
  ): Promise<PublicHabitCelebration[]> => {
    const size = Math.max(0, Math.trunc(limit));
    if (size === 0) return [];

    const celebrations =
      await createHabitCommunityRepository().findRecentPublicCelebrations(
        size,
        viewerId,
      );
    return celebrations.slice(0, size);
  },
);
