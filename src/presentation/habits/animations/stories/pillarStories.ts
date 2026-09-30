import type { PillarKey } from "~/domain/pillars/pillarKey";
import { MIND_SPIRIT_STORY } from "./mindSpiritStory";
import { MOVEMENT_STORY } from "./movementStory";
import { NUTRITION_STORY } from "./nutritionStory";
import type { PillarStory } from "./pillarStory";
import { SLEEP_STORY } from "./sleepStory";

/**
 * Las animaciones propias de cada pilar que ya existen. Un pilar sin la suya simplemente no está:
 * su página se ve como siempre.
 */
export const PILLAR_STORIES: Partial<Record<PillarKey, PillarStory>> = {
  sleep: SLEEP_STORY,
  nutrition: NUTRITION_STORY,
  movement: MOVEMENT_STORY,
  mindSpirit: MIND_SPIRIT_STORY,
};

export type StoryPillar = keyof typeof PILLAR_STORIES;
