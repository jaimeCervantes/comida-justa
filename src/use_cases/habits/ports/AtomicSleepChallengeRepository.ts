import type {
  CelebrationStatus,
  HabitChallengePeriod,
  LocalDate,
} from "~/domain/habits/atomicSleepChallenge";
import type { CuratedChallengeKey } from "~/domain/habits/curatedChallenges";
import type {
  CelebrationReactionIntent,
  CommunityGarden,
} from "~/domain/habits/habitCommunity";

export type HabitCelebrationMilestone = "first_cycle" | "challenge_completed";
export type HabitChallengeSchedule = HabitChallengePeriod;

export type StoredAtomicSleepProgress = {
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
  activeForOnboarding?: boolean;
};

export type PublicFirstCycleCelebration = {
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

export interface AtomicSleepChallengeRepository {
  start(userId: string, schedule: HabitChallengeSchedule): Promise<void>;
  findProgress(userId: string): Promise<StoredAtomicSleepProgress | null>;
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

export interface AtomicSleepCelebrationQuery {
  findLatestPublicCelebration(
    viewerId?: string | null,
  ): Promise<PublicFirstCycleCelebration | null>;
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
