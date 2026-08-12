import { describe, expect, it } from "vitest";
import { getHabitPublicTheme } from "./habitPublicThemes";
import { getPillarTheme } from "./pillarThemes";

const MIND_SPIRIT_TOKENS = [
  "pillar-mind-spirit-ink",
  "pillar-mind-spirit-soft",
  "pillar-mind-spirit-solid",
] as const;

describe("Mind and Spirit challenge themes", () => {
  it.each([
    ["pillar", () => getPillarTheme("mind")],
    ["public celebration", () => getHabitPublicTheme("mind")],
  ] as const)("uses the pillar palette in the %s theme", (_name, getTheme) => {
    const classes = Object.values(getTheme()).flat().join(" ");

    for (const token of MIND_SPIRIT_TOKENS) {
      expect(classes).toContain(token);
    }
    expect(classes).not.toContain("amber-");
  });
});

describe("every pillar theme", () => {
  it.each(["sleep", "nutrition", "movement", "mind"] as const)(
    "gives %s two anchor symbols, one per ancla",
    (challenge) => {
      expect(getPillarTheme(challenge).anchorSymbols).toHaveLength(2);
    },
  );

  it("never repeats a symbol between the cue and the minimum", () => {
    for (const challenge of [
      "sleep",
      "nutrition",
      "movement",
      "mind",
    ] as const) {
      const [cue, minimum] = getPillarTheme(challenge).anchorSymbols;
      expect(cue).not.toBe(minimum);
    }
  });
});
