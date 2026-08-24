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
  /**
   * La acción con la que se sale del héroe, y la letra pequeña que la acompaña.
   *
   * Entra armada desde fuera en vez de recibir texto y destino: cada portada decide si su acción es
   * un enlace interno, un ancla de la propia página o nada. Lo que este componente aporta es el
   * sitio y el aire, que es lo que faltaba — el héroe explicaba y no ofrecía nada que hacer.
   */
  action?: ReactNode;
  actionNote?: string;
  /**
   * El número del pilar, en su placa.
   *
   * «El número acompaña siempre al violeta», dice el 5.6, y no es decoración: Movimiento y Mente
   * contrastan 1.14 entre sí como tinta, así que el color por sí solo no distingue un pilar de
   * otro. El mismo motivo por el que la insignia de la tarjeta del feed ya lo lleva.
   */
  number?: number;
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
  action,
  actionNote,
  number,
}: PillarHeroProps): React.ReactNode {
  return (
    <header
      className={`relative isolate overflow-hidden px-6 py-10 text-white sm:px-10 sm:py-14 ${theme.hero} ${className}`}
    >
      <div className={`absolute inset-0 -z-10 opacity-20 ${theme.pattern}`} />
      <div
        className={`absolute -right-12 -top-20 -z-10 size-72 ${theme.orbit}`}
      />
      {(eyebrow || number !== undefined) && (
        <div className="flex items-center gap-3">
          {number !== undefined && (
            <span
              data-testid="pillar-hero-number"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20 text-base font-bold text-white"
            >
              {number}
            </span>
          )}
          {eyebrow && (
            <p
              className={`text-sm font-bold uppercase tracking-[0.22em] ${theme.heroEyebrow}`}
            >
              {eyebrow}
            </p>
          )}
        </div>
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
      {action && (
        <div
          data-testid="pillar-hero-action"
          className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3"
        >
          {action}
          {actionNote && (
            <p className={`text-sm ${theme.heroBody}`}>{actionNote}</p>
          )}
        </div>
      )}
    </header>
  );
}
