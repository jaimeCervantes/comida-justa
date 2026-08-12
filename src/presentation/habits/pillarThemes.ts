import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";

/**
 * La identidad visual de los cuatro pilares, en una sola tabla.
 *
 * Antes vivía repartida en dos módulos con la misma clave: uno para el hero y la práctica de los
 * tres pilares «profundos», otro para el panel de seguimiento de los cuatro, y Sueño encima tenía su
 * propia constante suelta porque no entraba en el primero. El resultado era que `text-pillar-X-ink`
 * estaba escrito tres veces por pilar y que añadir un pilar obligaba a tocar tres archivos y a
 * acordarse del caso especial.
 *
 * Con la tabla, un pilar se pinta desde un único sitio y Sueño deja de ser una excepción: es la
 * cuarta fila. Los consumidores siguen recibiendo solo la parte que les toca (`PillarHeroTheme`,
 * `HabitChallengeThemeConfig`), para que un componente de hero no pueda alcanzar las clases del
 * panel por accidente.
 */
export type PillarTheme = {
  /** Los dos símbolos de las anclas: primero la señal, después el mínimo. */
  anchorSymbols: readonly [string, string];
  accent: string;
  border: string;
  buttonClass: string;
  buttonColor: "green" | "orange";
  celebration: string;
  checkboxHover: string;
  finalCelebration: string;
  finalSymbol: string;
  firstSymbol: string;
  hero: string;
  heroBody: string;
  heroEyebrow: string;
  ink: string;
  orbit: string;
  pattern: string;
  quoteBorder: string;
  ritualSurface: string;
  soft: string;
  solid: string;
  solidBorder: string;
  stepBorder: string;
};

/** Lo que necesita un hero de pilar: fondo, texto sobre ese fondo y adornos. */
export type PillarHeroTheme = Pick<
  PillarTheme,
  "hero" | "heroBody" | "heroEyebrow" | "orbit" | "pattern" | "quoteBorder"
>;

/** Lo que necesita el panel de seguimiento y sus celebraciones. */
export type HabitChallengeThemeConfig = Pick<
  PillarTheme,
  | "accent"
  | "border"
  | "buttonClass"
  | "buttonColor"
  | "celebration"
  | "checkboxHover"
  | "finalCelebration"
  | "finalSymbol"
  | "firstSymbol"
  | "ink"
  | "soft"
  | "solidBorder"
>;

const PILLAR_THEMES = {
  sleep: {
    anchorSymbols: ["☾", "☀"],
    accent: "accent-pillar-sleep-solid",
    border: "border-pillar-sleep-ink/25",
    buttonClass: "",
    buttonColor: "green",
    celebration: "border-pillar-sleep-ink/30 bg-pillar-sleep-soft",
    checkboxHover: "hover:border-pillar-sleep-ink/50",
    finalCelebration:
      "border-orange-400 bg-[radial-gradient(circle_at_top,#fff4d6,var(--color-pillar-sleep-soft))]",
    finalSymbol: "🌾",
    firstSymbol: "🌱",
    hero: "bg-[linear-gradient(145deg,#17112f_0%,#35245f_48%,#e98a45_140%)]",
    heroBody: "text-white/90",
    heroEyebrow: "text-white/80",
    ink: "text-pillar-sleep-ink",
    orbit: "rounded-full bg-orange-300/20 blur-3xl",
    pattern:
      "[background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.2)_0_1px,transparent_1.5px),radial-gradient(circle_at_80%_45%,rgba(255,255,255,.18)_0_1px,transparent_1.5px)] [background-size:54px_54px,76px_76px]",
    quoteBorder: "border-orange-300",
    ritualSurface: "bg-surface-elevation-2",
    soft: "bg-pillar-sleep-soft",
    solid: "bg-pillar-sleep-solid",
    solidBorder: "border-pillar-sleep-ink",
    stepBorder: "border-separator",
  },
  nutrition: {
    anchorSymbols: ["🍽", "🌿"],
    accent: "accent-pillar-nutrition-solid",
    border: "border-pillar-nutrition-ink/30",
    buttonClass: "",
    buttonColor: "orange",
    celebration:
      "border-pillar-nutrition-ink/30 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.7),transparent_45%),var(--color-pillar-nutrition-soft)]",
    checkboxHover: "hover:border-pillar-nutrition-ink/50",
    finalCelebration:
      "border-pillar-nutrition-ink bg-[radial-gradient(circle_at_top,#fff4d6,var(--color-pillar-nutrition-soft))]",
    finalSymbol: "◉",
    firstSymbol: "●",
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
    solid: "bg-pillar-nutrition-solid",
    solidBorder: "border-pillar-nutrition-ink",
    stepBorder: "border-pillar-nutrition-ink/20",
  },
  movement: {
    anchorSymbols: ["🔔", "🏃"],
    accent: "accent-pillar-movement-solid",
    border: "border-pillar-movement-ink/30",
    buttonClass: "",
    buttonColor: "green",
    celebration:
      "border-pillar-movement-ink/30 bg-[linear-gradient(120deg,var(--color-pillar-movement-soft),var(--color-surface-elevation-1))]",
    checkboxHover: "hover:border-pillar-movement-ink/50",
    finalCelebration:
      "border-pillar-movement-ink bg-[radial-gradient(circle_at_top,#f0fce8,var(--color-pillar-movement-soft))]",
    finalSymbol: "◎",
    firstSymbol: "↗",
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
    solid: "bg-pillar-movement-solid",
    solidBorder: "border-pillar-movement-ink",
    stepBorder: "border-pillar-movement-ink/20",
  },
  mind: {
    anchorSymbols: ["🔕", "🤝"],
    accent: "accent-pillar-mind-spirit-solid",
    border: "border-pillar-mind-spirit-ink/30",
    buttonClass:
      "bg-pillar-mind-spirit-solid hover:bg-pillar-mind-spirit-solid/80",
    buttonColor: "orange",
    celebration:
      "border-pillar-mind-spirit-ink/30 bg-[radial-gradient(circle_at_top_right,var(--color-pillar-mind-spirit-soft),transparent_58%),var(--color-surface-elevation-1)]",
    checkboxHover: "hover:border-pillar-mind-spirit-ink/50",
    finalCelebration:
      "border-pillar-mind-spirit-ink bg-[radial-gradient(circle_at_top,var(--color-pillar-mind-spirit-soft),var(--color-surface-elevation-1))]",
    finalSymbol: "○—○—○",
    firstSymbol: "○—○",
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
    solid: "bg-pillar-mind-spirit-solid",
    solidBorder: "border-pillar-mind-spirit-ink",
    stepBorder: "border-pillar-mind-spirit-ink/20",
  },
} as const satisfies Record<HabitChallengeExperienceKey, PillarTheme>;

export function getPillarTheme(
  challenge: HabitChallengeExperienceKey,
): PillarTheme {
  return PILLAR_THEMES[challenge];
}
