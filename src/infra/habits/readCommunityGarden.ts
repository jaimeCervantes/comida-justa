import { cache } from "react";
import type { CommunityGarden } from "~/domain/habits/habitCommunity";
import { createHabitCommunityRepository } from "~/infra/dataAccess/habits/PostgresHabitChallengeRepository";

export const readCommunityGarden = cache(
  async (): Promise<CommunityGarden> =>
    createHabitCommunityRepository().readCommunityGarden(),
);
