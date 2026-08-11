import { describe, expect, it } from "vitest";
import {
  CURATED_CHALLENGES,
  evaluateTelegramReminderEligibility,
  findCuratedChallenge,
} from "./curatedChallenges";

describe("curated atomic challenges", () => {
  it("defines one stable practice for every pillar", () => {
    expect(
      CURATED_CHALLENGES.map(({ pillar, challengeKey }) => [
        pillar,
        challengeKey,
      ]),
    ).toEqual([
      ["sleep", "sleep-evening-to-morning-v1"],
      ["nutrition", "nutrition-one-plant-v1"],
      ["movement", "movement-two-minutes-v1"],
      ["mind", "mind-one-connection-v1"],
    ]);
  });

  it("resolves only curated route slugs", () => {
    expect(findCuratedChallenge("alimentacion")?.challengeKey).toBe(
      "nutrition-one-plant-v1",
    );
    expect(findCuratedChallenge("inventado")).toBeNull();
  });

  it("uses the Mind and Spirit pillar slug", () => {
    expect(findCuratedChallenge("mente-espiritu")?.challengeKey).toBe(
      "mind-one-connection-v1",
    );
    expect(findCuratedChallenge("mente-comunidad")).toBeNull();
  });

  it.each([
    [false, true, "channel-identity-unproven"],
    [true, false, "sending-port-unavailable"],
    [true, true, "eligible"],
  ] as const)(
    "evaluates identity=%s sender=%s as %s",
    (channelIdentityProven, sendingPortAvailable, expected) => {
      expect(
        evaluateTelegramReminderEligibility({
          channelIdentityProven,
          sendingPortAvailable,
        }),
      ).toBe(expected);
    },
  );
});
