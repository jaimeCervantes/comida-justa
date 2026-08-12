import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicHabitCelebration } from "~/use_cases/habits/ports/HabitChallengeRepository";
import { readLatestPublicCelebration } from "./readLatestPublicCelebration";
import {
  PUBLIC_CELEBRATION_LIST_LIMIT,
  readRecentPublicCelebrations,
} from "./readRecentPublicCelebrations";

const { findRecentPublicCelebrations } = vi.hoisted(() => ({
  findRecentPublicCelebrations: vi.fn().mockResolvedValue([]),
}));

vi.mock("~/infra/dataAccess/habits/PostgresHabitChallengeRepository", () => ({
  createHabitCommunityRepository: () => ({
    findRecentPublicCelebrations,
  }),
}));

describe("public celebration readers", () => {
  beforeEach(() => {
    findRecentPublicCelebrations.mockReset().mockResolvedValue([]);
  });

  it("requests the eight most recent celebrations when nobody asks for fewer", async () => {
    await readRecentPublicCelebrations("viewer-1");

    expect(findRecentPublicCelebrations).toHaveBeenCalledWith(
      PUBLIC_CELEBRATION_LIST_LIMIT,
      "viewer-1",
    );
    expect(PUBLIC_CELEBRATION_LIST_LIMIT).toBe(8);
  });

  it("asks the query for the amount the caller will paint, not the full list", async () => {
    await readRecentPublicCelebrations("viewer-two", 2);

    expect(findRecentPublicCelebrations).toHaveBeenCalledWith(2, "viewer-two");
  });

  it("never exposes a ninth celebration even if an adapter returns too many", async () => {
    findRecentPublicCelebrations.mockResolvedValue(
      Array.from({ length: 9 }, (_, index) =>
        celebration(`celebration-${index}`),
      ),
    );

    const result = await readRecentPublicCelebrations("viewer-limit");

    expect(result.map(({ id }) => id)).toEqual(
      Array.from({ length: 8 }, (_, index) => `celebration-${index}`),
    );
  });

  it("trims an over-generous adapter down to the requested amount", async () => {
    findRecentPublicCelebrations.mockResolvedValue([
      celebration("celebration-0"),
      celebration("celebration-1"),
      celebration("celebration-2"),
    ]);

    const result = await readRecentPublicCelebrations("viewer-trim", 2);

    expect(result.map(({ id }) => id)).toEqual([
      "celebration-0",
      "celebration-1",
    ]);
  });

  it("does not touch the database when no celebration is wanted", async () => {
    const result = await readRecentPublicCelebrations("viewer-none", 0);

    expect(result).toEqual([]);
    expect(findRecentPublicCelebrations).not.toHaveBeenCalled();
  });

  it("keeps the site message on only the latest celebration", async () => {
    await readLatestPublicCelebration("viewer-1");

    expect(findRecentPublicCelebrations).toHaveBeenCalledWith(1, "viewer-1");
  });
});

function celebration(id: string): PublicHabitCelebration {
  return {
    id,
    challengeKey: "sleep-evening-to-morning-v1",
    displayName: "Healthy Food",
    username: "healthy-food",
    image: null,
    publishedAt: new Date("2026-08-11T12:00:00Z"),
    milestone: "first_cycle",
    reactionCount: 0,
    viewerReacted: false,
  };
}
