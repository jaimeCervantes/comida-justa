import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";

export type HabitChallengeThemeConfig = {
  ink: string;
  soft: string;
  border: string;
  solidBorder: string;
  accent: string;
  checkboxHover: string;
  celebration: string;
  finalCelebration: string;
  buttonColor: "green" | "orange";
  buttonClass: string;
  firstSymbol: string;
  finalSymbol: string;
};

export function getHabitChallengeTheme(
  challenge: HabitChallengeExperienceKey,
): HabitChallengeThemeConfig {
  if (challenge === "nutrition") {
    return {
      ink: "text-pillar-nutrition-ink",
      soft: "bg-pillar-nutrition-soft",
      border: "border-pillar-nutrition-ink/25",
      solidBorder: "border-pillar-nutrition-ink",
      accent: "accent-pillar-nutrition-solid",
      checkboxHover: "hover:border-pillar-nutrition-ink/50",
      celebration:
        "border-pillar-nutrition-ink/30 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.7),transparent_45%),var(--color-pillar-nutrition-soft)]",
      finalCelebration:
        "border-pillar-nutrition-ink bg-[radial-gradient(circle_at_top,#fff4d6,var(--color-pillar-nutrition-soft))]",
      buttonColor: "orange",
      buttonClass: "",
      firstSymbol: "●",
      finalSymbol: "◉",
    };
  }
  if (challenge === "movement") {
    return {
      ink: "text-pillar-movement-ink",
      soft: "bg-pillar-movement-soft",
      border: "border-pillar-movement-ink/25",
      solidBorder: "border-pillar-movement-ink",
      accent: "accent-pillar-movement-solid",
      checkboxHover: "hover:border-pillar-movement-ink/50",
      celebration:
        "border-pillar-movement-ink/30 bg-[linear-gradient(120deg,var(--color-pillar-movement-soft),var(--color-surface-elevation-1))]",
      finalCelebration:
        "border-pillar-movement-ink bg-[radial-gradient(circle_at_top,#f0fce8,var(--color-pillar-movement-soft))]",
      buttonColor: "green",
      buttonClass: "",
      firstSymbol: "↗",
      finalSymbol: "◎",
    };
  }
  if (challenge === "mind") {
    return {
      ink: "text-pillar-mind-spirit-ink",
      soft: "bg-pillar-mind-spirit-soft",
      border: "border-pillar-mind-spirit-ink/25",
      solidBorder: "border-pillar-mind-spirit-ink",
      accent: "accent-pillar-mind-spirit-solid",
      checkboxHover: "hover:border-pillar-mind-spirit-ink/50",
      celebration:
        "border-pillar-mind-spirit-ink/30 bg-[radial-gradient(circle_at_top_right,var(--color-pillar-mind-spirit-soft),transparent_58%),var(--color-surface-elevation-1)]",
      finalCelebration:
        "border-pillar-mind-spirit-ink bg-[radial-gradient(circle_at_top,var(--color-pillar-mind-spirit-soft),var(--color-surface-elevation-1))]",
      buttonColor: "orange",
      buttonClass:
        "bg-pillar-mind-spirit-solid hover:bg-pillar-mind-spirit-solid/80",
      firstSymbol: "○—○",
      finalSymbol: "○—○—○",
    };
  }
  return {
    ink: "text-pillar-sleep-ink",
    soft: "bg-pillar-sleep-soft",
    border: "border-pillar-sleep-ink/25",
    solidBorder: "border-pillar-sleep-ink",
    accent: "accent-pillar-sleep-solid",
    checkboxHover: "hover:border-pillar-sleep-ink/50",
    celebration: "border-pillar-sleep-ink/30 bg-pillar-sleep-soft",
    finalCelebration:
      "border-orange-400 bg-[radial-gradient(circle_at_top,#fff4d6,var(--color-pillar-sleep-soft))]",
    buttonColor: "green",
    buttonClass: "",
    firstSymbol: "🌱",
    finalSymbol: "🌾",
  };
}
