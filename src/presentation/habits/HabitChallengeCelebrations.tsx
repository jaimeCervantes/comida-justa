import { HABIT_CHALLENGE_TARGET } from "~/domain/habits/habitChallenge";
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Heading } from "~/presentation/design_system/typography/Heading";
import type { HabitChallengeProgress } from "~/use_cases/habits/habitChallengeUseCase";
import type { HabitChallengeThemeConfig } from "./pillarThemes";
import type { HabitChallengeCopy } from "./useHabitChallengeCopy";

type HabitChallengeDispatch = (payload: FormData) => void;

export type HabitChallengeCelebrationsProps = {
  progress: HabitChallengeProgress;
  action: HabitChallengeDispatch;
  pending: boolean;
  copy: HabitChallengeCopy;
  theme: HabitChallengeThemeConfig;
  challenge: HabitChallengeExperienceKey;
};

/**
 * Los dos hitos se miden en la historia, no en la semana.
 *
 * Miraban `succeeded` y `completedCycles`, que desde que la semana se renueva son de la semana en
 * curso: la primera repetición de cada lunes habría vuelto a felicitar por una semilla que despertó
 * hace meses, y el hito final habría dicho «cinco» a quien se sumó un jueves y cumplió una meta de
 * tres. Cinco es el número que dice la redacción y el que exige `canPublishHabitCelebration`, así
 * que es el número que hay que contar.
 */
export function HabitChallengeCelebrations({
  progress,
  action,
  pending,
  copy,
  theme,
  challenge,
}: HabitChallengeCelebrationsProps): React.ReactNode {
  if (progress.repetitions >= HABIT_CHALLENGE_TARGET) {
    return (
      <FinalCelebration
        progress={progress}
        action={action}
        pending={pending}
        copy={copy}
        theme={theme}
        challenge={challenge}
      />
    );
  }
  if (progress.repetitions !== 1) return null;
  return (
    <FirstCelebration
      progress={progress}
      action={action}
      pending={pending}
      copy={copy}
      theme={theme}
      challenge={challenge}
    />
  );
}

function FirstCelebration({
  progress,
  action,
  pending,
  copy,
  theme,
  challenge,
}: HabitChallengeCelebrationsProps): React.ReactNode {
  return (
    <CelebrationShell
      symbol={theme.firstSymbol}
      eyebrow={copy.celebrationEyebrow}
      title={copy.celebrationTitle}
      theme={theme}
    >
      <p className="mx-auto mt-3 max-w-2xl text-lg text-body">
        {copy.celebrationBody}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <HabitChallengeReward
          label={`${copy.levelLabel}: ${copy.levelSprout}`}
          theme={theme}
        />
        <HabitChallengeReward label={copy.xp(progress.xp)} theme={theme} />
        <HabitChallengeReward label={copy.badgeFirst} theme={theme} />
      </div>
      <SharingForm
        action={action}
        pending={pending}
        shared={progress.celebrationStatus === "active"}
        milestone="first_cycle"
        copy={copy}
        theme={theme}
        challenge={challenge}
      />
    </CelebrationShell>
  );
}

function FinalCelebration({
  progress,
  action,
  pending,
  copy,
  theme,
  challenge,
}: HabitChallengeCelebrationsProps): React.ReactNode {
  return (
    <CelebrationShell
      symbol={theme.finalSymbol}
      eyebrow={copy.finalEyebrow}
      title={copy.finalTitle}
      theme={theme}
      strong
    >
      <p className="mx-auto mt-3 max-w-2xl text-lg text-body">
        {copy.finalBody}
      </p>
      {/* La honestidad de no afirmar un hábito es una promesa del producto, así que se puede señalar
          sin transcribirla: una prueba que copia esta frase se cae en cada retoque de redacción, y
          esta redacción acaba de cambiar por dejar de dar por hecha una semana de siete días. */}
      <p
        data-testid="habit-no-claim"
        className={`mx-auto mt-3 max-w-2xl text-sm font-semibold ${theme.ink}`}
      >
        {copy.noHabitClaim}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <HabitChallengeReward
          label={`${copy.levelLabel}: ${copy.levelHarvest}`}
          theme={theme}
        />
        <HabitChallengeReward label={copy.xp(progress.xp)} theme={theme} />
        <HabitChallengeReward label={copy.badgeHarvest} theme={theme} />
      </div>
      <SharingForm
        action={action}
        pending={pending}
        shared={progress.finalCelebrationStatus === "active"}
        milestone="challenge_completed"
        copy={copy}
        theme={theme}
        challenge={challenge}
      />
    </CelebrationShell>
  );
}

function CelebrationShell({
  symbol,
  eyebrow,
  title,
  strong = false,
  theme,
  children,
}: {
  symbol: string;
  eyebrow: string;
  title: string;
  strong?: boolean;
  theme: HabitChallengeThemeConfig;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <section
      aria-live="polite"
      className={`relative overflow-hidden rounded-panel border p-7 text-center shadow-lg sm:p-10 ${
        strong ? theme.finalCelebration : theme.celebration
      }`}
    >
      <div className="relative">
        <div aria-hidden="true" className="text-6xl">
          {symbol}
        </div>
        <p
          className={`mt-5 text-xs font-bold uppercase tracking-[0.2em] ${theme.ink}`}
        >
          {eyebrow}
        </p>
        <Heading
          level={2}
          size="lg"
          tone="inherit"
          className="mt-2 text-text-strong"
        >
          {title}
        </Heading>
        {children}
      </div>
    </section>
  );
}

function SharingForm({
  action,
  pending,
  shared,
  milestone,
  copy,
  theme,
  challenge,
}: {
  action: HabitChallengeDispatch;
  pending: boolean;
  shared: boolean;
  milestone: "first_cycle" | "challenge_completed";
  copy: HabitChallengeCopy;
  theme: HabitChallengeThemeConfig;
  challenge: HabitChallengeExperienceKey;
}): React.ReactNode {
  return (
    <>
      <p className="mx-auto mt-7 max-w-xl text-sm text-body">
        {shared ? copy.shared : copy.shareNote}
      </p>
      <form action={action} className="mt-4">
        <input
          type="hidden"
          name="intent"
          value={shared ? "withdraw" : "share"}
        />
        <input type="hidden" name="milestone" value={milestone} />
        <input type="hidden" name="challenge" value={challenge} />
        <Button
          type="submit"
          color={shared ? "default" : theme.buttonColor}
          className={shared ? undefined : theme.buttonClass}
          isLoading={pending}
          loadingLabel={copy.loading}
        >
          {shared ? copy.withdraw : copy.share}
        </Button>
      </form>
    </>
  );
}

export function HabitChallengeReward({
  label,
  theme,
}: {
  label: string;
  theme: HabitChallengeThemeConfig;
}): React.ReactNode {
  return (
    <span
      className={`rounded-full border bg-surface-elevation-1 px-4 py-2 text-sm font-bold shadow-sm ${theme.border} ${theme.ink}`}
    >
      {label}
    </span>
  );
}
