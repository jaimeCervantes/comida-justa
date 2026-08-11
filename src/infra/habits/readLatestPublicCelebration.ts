import { cache } from "react";
import { createAtomicSleepChallengeRepository } from "~/infra/dataAccess/habits/PostgresAtomicSleepChallengeRepository";
import type { PublicFirstCycleCelebration } from "~/use_cases/habits/ports/AtomicSleepChallengeRepository";

export const readLatestPublicCelebration = cache(
  async (
    viewerId?: string | null,
  ): Promise<PublicFirstCycleCelebration | null> =>
    createAtomicSleepChallengeRepository().findLatestPublicCelebration(
      viewerId,
    ),
);
