export type CuratedHabitPillar = "sleep" | "nutrition" | "movement" | "mind";
export type CuratedChallengeSlug =
  | "sueno"
  | "alimentacion"
  | "movimiento"
  | "mente-espiritu";
export type CuratedChallengeKey =
  | "sleep-evening-to-morning-v1"
  | "nutrition-one-plant-v1"
  | "movement-two-minutes-v1"
  | "mind-one-connection-v1";

export type CuratedChallenge = {
  slug: CuratedChallengeSlug;
  challengeKey: CuratedChallengeKey;
  pillar: CuratedHabitPillar;
};

export const CURATED_CHALLENGES: readonly CuratedChallenge[] = [
  {
    slug: "sueno",
    challengeKey: "sleep-evening-to-morning-v1",
    pillar: "sleep",
  },
  {
    slug: "alimentacion",
    challengeKey: "nutrition-one-plant-v1",
    pillar: "nutrition",
  },
  {
    slug: "movimiento",
    challengeKey: "movement-two-minutes-v1",
    pillar: "movement",
  },
  {
    slug: "mente-espiritu",
    challengeKey: "mind-one-connection-v1",
    pillar: "mind",
  },
] as const;

export const CURATED_CHALLENGE_KEYS: readonly CuratedChallengeKey[] =
  CURATED_CHALLENGES.map(({ challengeKey }) => challengeKey);

export function isCuratedChallengeKey(
  candidate: string,
): candidate is CuratedChallengeKey {
  return CURATED_CHALLENGE_KEYS.some((key) => key === candidate);
}

export function findCuratedChallenge(slug: string): CuratedChallenge | null {
  return (
    CURATED_CHALLENGES.find((challenge) => challenge.slug === slug) ?? null
  );
}

export type TelegramReminderEligibility =
  | "eligible"
  | "channel-identity-unproven"
  | "sending-port-unavailable";

export function evaluateTelegramReminderEligibility({
  channelIdentityProven,
  sendingPortAvailable,
}: {
  channelIdentityProven: boolean;
  sendingPortAvailable: boolean;
}): TelegramReminderEligibility {
  if (!channelIdentityProven) return "channel-identity-unproven";
  return sendingPortAvailable ? "eligible" : "sending-port-unavailable";
}
