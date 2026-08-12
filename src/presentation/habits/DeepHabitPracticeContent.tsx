import type { AtomicSleepProgress } from "~/use_cases/habits/atomicSleepChallengeUseCase";
import type {
  DeepHabitChallengeCopy,
  DeepHabitChallengeKey,
} from "./deepHabitChallengeCopy";
import type { DeepHabitChallengeTheme } from "./deepHabitChallengeThemes";
import HabitChallengePanel, {
  type HabitChallengeAction,
} from "./HabitChallengePanel";
import PillarHero from "./PillarHero";

export type DeepHabitPracticeContentProps = {
  challenge: DeepHabitChallengeKey;
  action: HabitChallengeAction;
  copy: DeepHabitChallengeCopy;
  progress: AtomicSleepProgress | null;
  signedIn: boolean;
  signInHref: string;
  theme: DeepHabitChallengeTheme;
};

export default function DeepHabitPracticeContent({
  challenge,
  action,
  copy,
  progress,
  signedIn,
  signInHref,
  theme,
}: DeepHabitPracticeContentProps): React.ReactNode {
  return (
    <section
      id="practica"
      data-pillar={challenge}
      aria-labelledby={`${challenge}-practice-title`}
      className={`relative isolate overflow-hidden rounded-[2rem] border bg-surface-base shadow-xl ${theme.softBorder}`}
    >
      <PillarHero
        level={2}
        id={`${challenge}-practice-title`}
        eyebrow={copy.eyebrow}
        title={copy.title}
        intro={copy.intro}
        theme={theme}
      />

      <div className="px-6 py-10 sm:px-10 sm:py-12">
        <div className="grid gap-5 sm:grid-cols-2">
          <ChallengeAnchorCard
            symbol="01"
            title={copy.cueTitle}
            body={copy.cueBody}
            theme={theme}
          />
          <ChallengeAnchorCard
            symbol="+1"
            title={copy.minimumTitle}
            body={copy.minimumBody}
            theme={theme}
          />
        </div>
        <aside
          className={`mt-5 rounded-3xl border border-dashed p-6 ${theme.softBorder} ${theme.soft}`}
        >
          <h3 className="text-xl font-black text-text-strong">
            {copy.preparationTitle}
          </h3>
          <p className="mt-2 text-body">{copy.preparationBody}</p>
        </aside>
        <HabitChallengePanel
          action={action}
          challenge={challenge}
          initialProgress={progress}
          signedIn={signedIn}
          signInHref={signInHref}
        />

        <section
          className={`mt-16 rounded-[2rem] p-6 sm:p-10 ${theme.ritualSurface}`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-[0.2em] ${theme.ink}`}
          >
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-text-strong">
            {copy.ritualTitle}
          </h2>
          <p className="mt-3 max-w-3xl text-body">{copy.ritualBody}</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {copy.ritualSteps.map((step, index) => (
              <li
                key={step}
                className={`rounded-2xl border bg-surface-base p-5 ${theme.stepBorder}`}
              >
                <span
                  className={`grid size-9 place-items-center rounded-full font-black text-white ${theme.solid}`}
                >
                  {index + 1}
                </span>
                <span className="mt-4 block text-sm font-semibold text-text-strong">
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 border-l-4 border-feedback-warning bg-feedback-warning/10 p-4 text-sm text-body">
            {copy.safety}
          </p>
        </section>

        <section className="mt-6 rounded-3xl border border-feedback-warning/40 bg-feedback-warning/10 p-6">
          <h2 className="font-black text-text-strong">{copy.reminderTitle}</h2>
          <p className="mt-2 text-body">{copy.reminderUnavailable}</p>
          <button
            type="button"
            disabled
            className="mt-4 rounded-lg border px-4 py-2 font-bold opacity-60"
          >
            {copy.reminderDisabled}
          </button>
        </section>
      </div>
    </section>
  );
}

function ChallengeAnchorCard({
  symbol,
  title,
  body,
  theme,
}: {
  symbol: string;
  title: string;
  body: string;
  theme: DeepHabitChallengeTheme;
}): React.ReactNode {
  return (
    <article
      className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${theme.softBorder} ${theme.soft}`}
    >
      <span className={`text-sm font-black tracking-[0.2em] ${theme.ink}`}>
        {symbol}
      </span>
      <h3 className="mt-4 text-2xl font-extrabold text-text-strong">{title}</h3>
      <p className="mt-2 text-body">{body}</p>
    </article>
  );
}
