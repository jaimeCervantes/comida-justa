import type { ReactNode } from "react";
import { Heading } from "~/presentation/design_system/typography/Heading";
import type { PillarHeroTheme } from "./pillarThemes";

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
      {/* El nombre de un pilar va en la serif de la marca: es lo que dice el docstring de
          `Heading` —«`display` y `lg` van en Newsreader… la portada, el nombre de un pilar»— y
          este hero se había quedado con un `text-5xl font-black` escrito a mano. El nivel sigue
          decidiéndolo quien llama; el tamaño ya no. */}
      <Heading
        level={level}
        size="display"
        tone="inherit"
        id={id}
        className="mt-3 max-w-4xl text-white"
      >
        {title}
      </Heading>
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
