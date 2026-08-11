import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";

export type HabitPublicTheme = {
  article: string;
  aside: string;
  border: string;
  ink: string;
  pillar: HabitChallengeExperienceKey;
  soft: string;
  symbol: string;
};

export function getHabitPublicTheme(
  challenge: HabitChallengeExperienceKey,
): HabitPublicTheme {
  if (challenge === "nutrition") {
    return {
      pillar: "nutrition",
      article:
        "border-pillar-nutrition-ink/30 bg-[radial-gradient(circle_at_top_right,var(--color-pillar-nutrition-soft),transparent_48%),linear-gradient(135deg,var(--color-surface-elevation-1),var(--color-surface-elevation-2))]",
      aside: "border-pillar-nutrition-ink/25 bg-pillar-nutrition-soft",
      soft: "bg-pillar-nutrition-soft ring-pillar-nutrition-soft/60",
      ink: "text-pillar-nutrition-ink",
      border: "border-pillar-nutrition-ink/30",
      symbol: "◉",
    };
  }
  if (challenge === "movement") {
    return {
      pillar: "movement",
      article:
        "border-pillar-movement-ink/30 bg-[linear-gradient(135deg,var(--color-pillar-movement-soft),var(--color-surface-elevation-1))]",
      aside: "border-pillar-movement-ink/25 bg-pillar-movement-soft",
      soft: "bg-pillar-movement-soft ring-pillar-movement-soft/60",
      ink: "text-pillar-movement-ink",
      border: "border-pillar-movement-ink/30",
      symbol: "↗",
    };
  }
  if (challenge === "mind") {
    return {
      pillar: "mind",
      article:
        "border-pillar-mind-spirit-ink/30 bg-[radial-gradient(circle_at_top_right,var(--color-pillar-mind-spirit-soft),transparent_52%),linear-gradient(135deg,var(--color-surface-elevation-1),var(--color-pillar-mind-spirit-soft))]",
      aside: "border-pillar-mind-spirit-ink/25 bg-pillar-mind-spirit-soft",
      soft: "bg-pillar-mind-spirit-soft ring-pillar-mind-spirit-solid/20",
      ink: "text-pillar-mind-spirit-ink",
      border: "border-pillar-mind-spirit-ink/30",
      symbol: "○—○",
    };
  }
  return {
    pillar: "sleep",
    article:
      "border-pillar-sleep-ink/30 bg-[radial-gradient(circle_at_top_right,var(--color-pillar-sleep-soft),transparent_48%),linear-gradient(135deg,var(--color-surface-elevation-1),var(--color-surface-elevation-2))]",
    aside: "border-pillar-sleep-ink/25 bg-pillar-sleep-soft",
    soft: "bg-pillar-sleep-soft ring-pillar-sleep-soft/60",
    ink: "text-pillar-sleep-ink",
    border: "border-pillar-sleep-ink/30",
    symbol: "☾",
  };
}
