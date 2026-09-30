import type { PillarKey } from "~/domain/pillars/pillarKey";
import type { PillarStory } from "./pillarStory";
import { SLEEP_STORY } from "./sleepStory";

/**
 * Las animaciones propias de cada pilar que ya existen. Un pilar sin la suya simplemente no está:
 * su página se ve como siempre.
 */
export const PILLAR_STORIES: Partial<Record<PillarKey, PillarStory>> = {
  sleep: SLEEP_STORY,
};

export type StoryPillar = keyof typeof PILLAR_STORIES;
