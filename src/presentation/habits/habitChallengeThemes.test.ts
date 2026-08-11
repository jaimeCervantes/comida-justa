import { describe, expect, it } from "vitest";
import { getDeepHabitChallengeTheme } from "./deepHabitChallengeThemes";
import { getHabitChallengeTheme } from "./habitChallengeThemes";
import { getHabitPublicTheme } from "./habitPublicThemes";

const MIND_SPIRIT_TOKENS = [
  "pillar-mind-spirit-ink",
  "pillar-mind-spirit-soft",
  "pillar-mind-spirit-solid",
] as const;

describe("Mind and Spirit challenge themes", () => {
  it.each([
    ["deep experience", () => getDeepHabitChallengeTheme("mind")],
    ["tracking panel", () => getHabitChallengeTheme("mind")],
    ["public celebration", () => getHabitPublicTheme("mind")],
  ] as const)("uses the pillar palette in the %s", (_name, getTheme) => {
    const classes = Object.values(getTheme()).join(" ");

    for (const token of MIND_SPIRIT_TOKENS) {
      expect(classes).toContain(token);
    }
    expect(classes).not.toContain("amber-");
  });
});
