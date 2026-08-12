import type { CuratedChallengeKey } from "~/domain/habits/curatedChallenges";
import type {
  CelebrationStatus,
  HabitChallengePeriod,
  LocalDate,
} from "~/domain/habits/habitChallenge";
import type {
  CelebrationReactionIntent,
  CommunityGarden,
  HabitCelebrationMilestone,
} from "~/domain/habits/habitCommunity";

export type { HabitCelebrationMilestone } from "~/domain/habits/habitCommunity";
export type HabitChallengeSchedule = HabitChallengePeriod;

export type StoredHabitChallengeProgress = {
  userId: string;
  challengeKey: string;
  startedAt: Date;
  startDate: LocalDate | null;
  endDate: LocalDate | null;
  timezone: string | null;
  firstCycleCompletedAt: Date | null;
  finalCompletedAt: Date | null;
  completedDates: LocalDate[];
  celebrationStatus: CelebrationStatus;
  finalCelebrationStatus: CelebrationStatus;
  gardenSharingEnabled: boolean;
};

/**
 * Una celebración que alguien decidió hacer pública.
 *
 * Se llamaba `PublicFirstCycleCelebration` cuando lo único compartible era la primera repetición.
 * Desde que también se puede compartir la meta cumplida lleva `milestone`, así que el nombre decía
 * lo contrario de lo que trae el campo.
 */
export type PublicHabitCelebration = {
  id: string;
  displayName: string | null;
  username: string | null;
  image: string | null;
  publishedAt: Date;
  milestone: HabitCelebrationMilestone;
  challengeKey: CuratedChallengeKey;
  reactionCount: number;
  viewerReacted: boolean;
};

export interface HabitChallengeRepository {
  start(userId: string, schedule: HabitChallengeSchedule): Promise<void>;
  findProgress(userId: string): Promise<StoredHabitChallengeProgress | null>;
  recordCycle(
    userId: string,
    cycleDate: LocalDate,
    completedAt: Date,
  ): Promise<boolean>;
  publishCelebration(
    userId: string,
    milestone: HabitCelebrationMilestone,
  ): Promise<boolean>;
  withdrawCelebration(
    userId: string,
    milestone: HabitCelebrationMilestone,
  ): Promise<void>;
  setGardenSharing(userId: string, enabled: boolean): Promise<void>;
}

export interface HabitCelebrationQuery {
  findRecentPublicCelebrations(
    limit: number,
    viewerId?: string | null,
  ): Promise<PublicHabitCelebration[]>;
}

export interface HabitCommunityRepository {
  setGardenSharing(userId: string, enabled: boolean): Promise<void>;
  readCommunityGarden(): Promise<CommunityGarden>;
  setCelebrationReaction(
    userId: string,
    celebrationId: string,
    intent: CelebrationReactionIntent,
  ): Promise<void>;
}
