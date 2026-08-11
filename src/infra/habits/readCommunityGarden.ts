import { cache } from "react";
import type { CommunityGarden } from "~/domain/habits/habitCommunity";
import { createAtomicSleepChallengeRepository } from "~/infra/dataAccess/habits/PostgresAtomicSleepChallengeRepository";

export const readCommunityGarden = cache(
  async (): Promise<CommunityGarden> =>
    createAtomicSleepChallengeRepository().readCommunityGarden(),
);
