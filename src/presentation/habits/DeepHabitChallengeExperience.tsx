import type { AtomicSleepProgress } from "~/use_cases/habits/atomicSleepChallengeUseCase";
import {
  type DeepHabitChallengeKey,
  getDeepHabitChallengeCopy,
} from "./deepHabitChallengeCopy";
import {
  type DeepHabitChallengeTheme,
  getDeepHabitChallengeTheme,
} from "./deepHabitChallengeThemes";
import HabitChallengePanel, {
  type HabitChallengeAction,
} from "./HabitChallengePanel";

export type DeepHabitChallengeExperienceProps = {
  challenge: DeepHabitChallengeKey;
  action: HabitChallengeAction;
  progress: AtomicSleepProgress | null;
  signedIn: boolean;
  signInHref: string;
};

export default async function DeepHabitChallengeExperience({
  challenge,
  action,
  progress,
  signedIn,
  signInHref,
}: DeepHabitChallengeExperienceProps): Promise<React.ReactNode> {
  const copy = await getDeepHabitChallengeCopy(challenge);
  const theme = getDeepHabitChallengeTheme(challenge);

  return (
    <main className="pb-16">
      <header
        data-pillar={challenge}
        className={`relative isolate overflow-hidden rounded-[2rem] px-6 py-14 text-white shadow-xl sm:px-12 sm:py-20 ${theme.hero}`}
      >
        <div className={`absolute inset-0 -z-10 opacity-20 ${theme.pattern}`} />
        <div
          className={`absolute -right-16 -top-20 -z-10 size-80 ${theme.orbit}`}
        />
        <p
          className={`text-sm font-bold uppercase tracking-[0.22em] ${theme.heroEyebrow}`}
        >
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
          {copy.title}
        </h1>
        <p
          className={`mt-5 max-w-2xl text-lg leading-relaxed sm:text-xl ${theme.heroBody}`}
        >
          {copy.intro}
        </p>
        <blockquote
          className={`mt-8 max-w-3xl border-l-4 pl-5 text-xl font-semibold italic text-white ${theme.quoteBorder}`}
        >
          “{copy.identity}”
        </blockquote>
      </header>

      <section className="mx-auto mt-12 max-w-5xl">
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
          <h2 className="text-xl font-black text-text-strong">
            {copy.preparationTitle}
          </h2>
          <p className="mt-2 text-body">{copy.preparationBody}</p>
        </aside>
        <HabitChallengePanel
          action={action}
          challenge={challenge}
          initialProgress={progress}
          signedIn={signedIn}
          signInHref={signInHref}
        />
      </section>

      <section
        className={`mx-auto mt-16 max-w-5xl rounded-[2rem] p-6 sm:p-10 ${theme.ritualSurface}`}
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
        <ol className="mt-8 grid gap-4 sm:grid-cols-5">
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
      <section className="mx-auto mt-6 max-w-5xl rounded-3xl border border-feedback-warning/40 bg-feedback-warning/10 p-6">
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
    </main>
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
      <h2 className="mt-4 text-2xl font-extrabold text-text-strong">{title}</h2>
      <p className="mt-2 text-body">{body}</p>
    </article>
  );
}
