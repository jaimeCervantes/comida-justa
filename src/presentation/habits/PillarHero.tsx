import type { DeepHabitChallengeTheme } from "./deepHabitChallengeThemes";
import type { ReactNode } from "react";

export type PillarHeroTheme = Pick<
  DeepHabitChallengeTheme,
  "hero" | "heroBody" | "heroEyebrow" | "orbit" | "pattern" | "quoteBorder"
>;

export const SLEEP_PILLAR_HERO_THEME: PillarHeroTheme = {
  hero: "bg-[linear-gradient(145deg,#17112f_0%,#35245f_48%,#e98a45_140%)]",
  heroBody: "text-white/90",
  heroEyebrow: "text-white/80",
  orbit: "rounded-full bg-orange-300/20 blur-3xl",
  pattern:
    "[background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.2)_0_1px,transparent_1.5px),radial-gradient(circle_at_80%_45%,rgba(255,255,255,.18)_0_1px,transparent_1.5px)] [background-size:54px_54px,76px_76px]",
  quoteBorder: "border-orange-300",
};

type PillarHeroProps = {
  level: 1 | 2;
  title: ReactNode;
  intro: string;
  theme: PillarHeroTheme;
  identity?: string;
  eyebrow?: string;
  id?: string;
  className?: string;
};

export default function PillarHero({
  level,
  title,
  intro,
  theme,
  identity,
  eyebrow,
  id,
  className = "",
}: PillarHeroProps): React.ReactNode {
  const Title = level === 1 ? "h1" : "h2";

  return (
    <header
      className={`relative isolate overflow-hidden px-6 py-10 text-white sm:px-10 sm:py-14 ${theme.hero} ${className}`}
    >
      <div className={`absolute inset-0 -z-10 opacity-20 ${theme.pattern}`} />
      <div
        className={`absolute -right-12 -top-20 -z-10 size-72 ${theme.orbit}`}
      />
      {eyebrow && (
        <p
          className={`text-sm font-bold uppercase tracking-[0.22em] ${theme.heroEyebrow}`}
        >
          {eyebrow}
        </p>
      )}
      <Title
        id={id}
        className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-5xl"
      >
        {title}
      </Title>
      <p
        className={`mt-5 max-w-2xl text-lg leading-relaxed sm:text-xl ${theme.heroBody}`}
      >
        {intro}
      </p>
      {identity && (
        <blockquote
          className={`mt-8 max-w-2xl border-l-4 pl-5 text-xl font-semibold italic text-white ${theme.quoteBorder}`}
        >
          “{identity}”
        </blockquote>
      )}
    </header>
  );
}
