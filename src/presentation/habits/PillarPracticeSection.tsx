import type { ReactNode } from "react";
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";
import PillarHero from "./PillarHero";
import type { PillarTheme } from "./pillarThemes";

/**
 * La práctica de un pilar: el hero del reto, sus dos anclas, el seguimiento y el ritual.
 *
 * Es una sola para los cuatro. Antes había dos —la de Sueño y la de «los otros tres»— y cada mejora
 * se quedaba en una: Sueño tenía anclas con símbolo y un ritual de dos columnas legible, mientras
 * los demás mostraban `01`/`+1` y cinco columnas apretadas más un botón permanentemente
 * deshabilitado que no llevaba a ninguna parte.
 *
 * Las diferencias reales de contenido entran como piezas opcionales, no como componentes distintos:
 * Sueño abre con su versión mínima (`lead`) y los otros tres cierran las anclas con una nota de
 * preparación (`note`). Todo lo demás lo comparten.
 *
 * No lee el catálogo: recibe `copy` ya resuelta. Así se puede probar cada pilar sin montar el
 * contexto de traducciones y sin que la prueba dependa de la redacción vigente.
 */
export type PracticeAnchor = {
  symbol: string;
  title: string;
  body: string;
};

export type PillarPracticeCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  /** El mínimo que hace contar una repetición, cuando el pilar lo enuncia aparte. */
  lead?: { heading: string; body: string };
  anchors: readonly [PracticeAnchor, PracticeAnchor];
  /** La preparación que ayuda pero no es requisito. */
  note?: { title: string; body: string };
  ritual: {
    eyebrow: string;
    title: string;
    body: string;
    steps: readonly string[];
    safety: string;
  };
};

export default function PillarPracticeSection({
  challenge,
  copy,
  theme,
  panel,
}: {
  challenge: HabitChallengeExperienceKey;
  copy: PillarPracticeCopy;
  theme: PillarTheme;
  panel: ReactNode;
}): React.ReactNode {
  const titleId = `${challenge}-practice-title`;

  return (
    <section
      id="practica"
      data-pillar={challenge}
      aria-labelledby={titleId}
      className={`relative isolate overflow-hidden rounded-[2rem] border bg-surface-base shadow-xl ${theme.border}`}
    >
      <PillarHero
        level={2}
        id={titleId}
        eyebrow={copy.eyebrow}
        title={copy.title}
        intro={copy.intro}
        theme={theme}
      />

      <div className="px-6 py-10 sm:px-10 sm:py-12">
        {copy.lead && (
          <div className="mb-8 text-center">
            <p
              className={`text-xs font-bold uppercase tracking-[0.2em] ${theme.ink}`}
            >
              {copy.lead.heading}
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-body">
              {copy.lead.body}
            </p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {copy.anchors.map((anchor) => (
            <PracticeAnchorCard
              key={anchor.title}
              anchor={anchor}
              theme={theme}
            />
          ))}
        </div>

        {copy.note && (
          <aside
            className={`mt-5 rounded-3xl border border-dashed p-6 ${theme.border} ${theme.soft}`}
          >
            <h3 className="text-xl font-black text-text-strong">
              {copy.note.title}
            </h3>
            <p className="mt-2 text-body">{copy.note.body}</p>
          </aside>
        )}

        {panel}

        <section
          className={`mt-16 rounded-3xl p-6 sm:p-10 ${theme.ritualSurface}`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-[0.2em] ${theme.ink}`}
          >
            {copy.ritual.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-text-strong">
            {copy.ritual.title}
          </h2>
          <p className="mt-3 max-w-3xl text-body">{copy.ritual.body}</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {copy.ritual.steps.map((step, index) => (
              <li
                key={step}
                className={`flex gap-4 rounded-2xl border bg-surface-base p-5 ${theme.stepBorder}`}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full font-bold text-white ${theme.solid}`}
                >
                  {index + 1}
                </span>
                <span className="text-body">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-8 border-l-4 border-feedback-warning bg-feedback-warning/10 p-4 text-sm text-body">
            {copy.ritual.safety}
          </p>
        </section>
      </div>
    </section>
  );
}

function PracticeAnchorCard({
  anchor,
  theme,
}: {
  anchor: PracticeAnchor;
  theme: PillarTheme;
}): React.ReactNode {
  return (
    <article
      className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${theme.border} ${theme.soft}`}
    >
      <span
        aria-hidden="true"
        className={`absolute -right-4 -top-8 text-8xl opacity-10 ${theme.ink}`}
      >
        {anchor.symbol}
      </span>
      <span className="text-4xl" aria-hidden="true">
        {anchor.symbol}
      </span>
      <h3 className="mt-4 text-2xl font-extrabold text-text-strong">
        {anchor.title}
      </h3>
      <p className="mt-2 text-body">{anchor.body}</p>
    </article>
  );
}
