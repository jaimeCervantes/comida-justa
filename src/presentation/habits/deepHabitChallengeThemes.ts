import type { DeepHabitChallengeKey } from "./deepHabitChallengeCopy";

export type DeepHabitChallengeTheme = {
  hero: string;
  heroBody: string;
  heroEyebrow: string;
  ink: string;
  orbit: string;
  pattern: string;
  quoteBorder: string;
  ritualSurface: string;
  soft: string;
  softBorder: string;
  solid: string;
  stepBorder: string;
};

export function getDeepHabitChallengeTheme(
  challenge: DeepHabitChallengeKey,
): DeepHabitChallengeTheme {
  if (challenge === "mind") {
    return {
      hero: "bg-pillar-mind-spirit-solid",
      heroBody: "text-white/90",
      heroEyebrow: "text-white/80",
      ink: "text-pillar-mind-spirit-ink",
      orbit:
        "rounded-full border-[3px] border-pillar-mind-spirit-soft/30 shadow-[0_0_0_34px_rgba(255,255,255,.12),0_0_0_68px_rgba(255,255,255,.08)]",
      pattern:
        "[background-image:radial-gradient(circle_at_20%_20%,white_0_4px,transparent_5px),linear-gradient(35deg,transparent_49%,white_50%,transparent_51%)] [background-size:96px_96px]",
      quoteBorder: "border-pillar-mind-spirit-soft",
      ritualSurface:
        "bg-[radial-gradient(circle_at_top_right,var(--color-pillar-mind-spirit-soft),transparent_42%),linear-gradient(145deg,var(--color-pillar-mind-spirit-soft),var(--color-surface-elevation-2))]",
      soft: "bg-pillar-mind-spirit-soft",
      softBorder: "border-pillar-mind-spirit-ink/30",
      solid: "bg-pillar-mind-spirit-solid",
      stepBorder: "border-pillar-mind-spirit-ink/20",
    };
  }
  if (challenge === "movement") {
    return {
      hero: "bg-[linear-gradient(125deg,#173b13_0%,var(--color-pillar-movement-solid)_58%,#84cc16_140%)]",
      heroBody: "text-lime-50",
      heroEyebrow: "text-lime-100",
      ink: "text-pillar-movement-ink",
      orbit:
        "rotate-12 border-[28px] border-lime-200/20 [clip-path:polygon(0_40%,100%_0,100%_60%,0_100%)]",
      pattern:
        "[background-image:repeating-linear-gradient(115deg,white_0_2px,transparent_2px_34px)]",
      quoteBorder: "border-lime-200",
      ritualSurface:
        "bg-[linear-gradient(145deg,var(--color-pillar-movement-soft),var(--color-surface-elevation-2))]",
      soft: "bg-pillar-movement-soft",
      softBorder: "border-pillar-movement-ink/30",
      solid: "bg-pillar-movement-solid",
      stepBorder: "border-pillar-movement-ink/20",
    };
  }
  return {
    hero: "bg-[linear-gradient(135deg,#7f1d08_0%,var(--color-pillar-nutrition-solid)_58%,#f59e0b_140%)]",
    heroBody: "text-orange-50",
    heroEyebrow: "text-orange-100",
    ink: "text-pillar-nutrition-ink",
    orbit: "rounded-full border-[40px] border-orange-200/20",
    pattern:
      "[background-image:radial-gradient(circle_at_20%_20%,white_0_3px,transparent_4px),radial-gradient(circle_at_80%_65%,white_0_7px,transparent_8px)] [background-size:72px_72px,130px_130px]",
    quoteBorder: "border-amber-200",
    ritualSurface:
      "bg-[linear-gradient(145deg,var(--color-pillar-nutrition-soft),var(--color-surface-elevation-2))]",
    soft: "bg-pillar-nutrition-soft",
    softBorder: "border-pillar-nutrition-ink/30",
    solid: "bg-pillar-nutrition-solid",
    stepBorder: "border-pillar-nutrition-ink/20",
  };
}
