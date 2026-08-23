"use client";

import { useLocale } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import {
  type LocalDate,
  listPeriodDates,
  localDateAt,
} from "~/domain/habits/habitChallenge";
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Alert } from "~/presentation/design_system/feedback/Alert";
import { Heading } from "~/presentation/design_system/typography/Heading";
import type { HabitChallengeProgress } from "~/use_cases/habits/habitChallengeUseCase";
import {
  HabitChallengeCelebrations,
  HabitChallengeReward,
} from "./HabitChallengeCelebrations";
import type {
  HabitChallengeAction,
  HabitChallengeActionState,
} from "./habitChallengeAction";
import { getPillarTheme, type HabitChallengeThemeConfig } from "./pillarThemes";
import { useHabitChallengeCopy } from "./useHabitChallengeCopy";

export type HabitChallengePanelProps = {
  challenge: HabitChallengeExperienceKey;
  action: HabitChallengeAction;
  initialProgress: HabitChallengeProgress | null;
  signedIn: boolean;
  signInHref: string;
};

export default function HabitChallengePanel({
  challenge,
  action: manageAction,
  initialProgress,
  signedIn,
  signInHref,
}: HabitChallengePanelProps): React.ReactNode {
  const copy = useHabitChallengeCopy(challenge);
  const theme = getPillarTheme(challenge);
  const locale = useLocale();
  const [timezone, setTimezone] = useState("UTC");
  const [today, setToday] = useState<LocalDate>("");
  const initialState: HabitChallengeActionState = {
    status: "idle",
    progress: initialProgress,
  };
  const [state, action, isPending] = useActionState(manageAction, initialState);
  const progress = state.progress;

  useEffect(() => {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(browserTimezone);
    setToday(localDateAt(new Date(), browserTimezone));
  }, []);

  if (!signedIn || state.needsSignIn) {
    return <SignInLink href={signInHref} label={copy.signInStart} />;
  }

  /**
   * Sin ventana abierta no hay calendario que pintar, solo una invitación.
   *
   * `periodClosed` lo decide el servidor. El panel solo conoce la hora del navegador, y hubo un mes
   * entero en que esta condición era únicamente `!progress?.period`: la ventana vencida seguía
   * siendo una ventana, así que se pintaban para siempre los siete días de la semana en que la
   * persona empezó, con sus fechas de hace dos semanas y un formulario que solo aceptaba días que
   * ya habían pasado.
   */
  if (!progress?.period || progress.periodClosed) {
    return (
      <div className="mt-8">
        {progress?.periodClosed && (
          <Alert
            tone="info"
            label={copy.weekClosed}
            className="mx-auto mb-6 max-w-2xl"
          >
            {copy.weekClosedBody}
          </Alert>
        )}
        <form action={action} className="flex justify-center">
          <input type="hidden" name="intent" value="start" />
          <input type="hidden" name="challenge" value={challenge} />
          <input type="hidden" name="timezone" value={timezone} />
          <Button
            type="submit"
            color={theme.buttonColor}
            className={theme.buttonClass}
            size="lg"
            isLoading={isPending}
            loadingLabel={copy.loading}
          >
            {progress ? copy.continueWeek : copy.start}
          </Button>
        </form>
      </div>
    );
  }

  const periodDates = listPeriodDates(progress.period);
  const availableDates = periodDates.filter(
    (date) => !progress.completedDates.includes(date) && date <= today,
  );

  return (
    <div className="mt-8 space-y-6">
      <section
        className={`rounded-panel border bg-surface-elevation-1 p-5 shadow-sm sm:p-7 ${theme.border}`}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p
              className={`text-xs font-bold uppercase tracking-[0.18em] ${theme.ink}`}
            >
              {copy.weekEyebrow}
            </p>
            <Heading level={2} tone="inherit" className="mt-1 text-text-strong">
              {copy.progressCounter(
                progress.completedCycles,
                progress.totalDays,
              )}
            </Heading>
            <p className="mt-1 text-sm text-body">
              {copy.weekTarget(progress.targetCycles, progress.totalDays)}
            </p>
          </div>
          {/* Aparece a partir de la segunda semana y ya no se va: «1 semana sostenida» no dice nada
              todavía, y su estreno reconoce justo lo que cuesta —haber vuelto—. Nunca baja, así que
              nadie la ve retroceder. */}
          <div className="flex flex-wrap items-center gap-2">
            {progress.sustainedWeeks > 1 && (
              <HabitChallengeReward
                label={copy.sustainedWeeks(progress.sustainedWeeks)}
                theme={theme}
              />
            )}
            <HabitChallengeReward label={copy.xp(progress.xp)} theme={theme} />
          </div>
        </div>

        <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {periodDates.map((date, index) => {
            const completed = progress.completedDates.includes(date);
            return (
              <li
                key={date}
                data-testid="challenge-day"
                className={`rounded-card border p-3 text-center ${
                  completed
                    ? `${theme.solidBorder} ${theme.soft}`
                    : "border-separator bg-surface-elevation-1"
                }`}
              >
                <span className="block text-xs font-bold uppercase text-body">
                  {copy.dayLabel(index + 1)}
                </span>
                <span className="mt-1 block text-sm font-semibold text-text-strong">
                  {formatLocalDate(date, locale)}
                </span>
                <span className="mt-1 block text-xs text-body">
                  {completed ? copy.dayCompleted : copy.dayPending}
                </span>
              </li>
            );
          })}
        </ol>

        {state.status === "comeback" && (
          <Alert tone="success" label={copy.comebackTitle} className="mt-5">
            {copy.comebackBody}
          </Alert>
        )}
        {state.status === "recorded" && (
          <Alert tone="success" label={copy.cycleRecorded} className="mt-5">
            {copy.cycleRecordedBody}
          </Alert>
        )}
        {state.status === "duplicate" && (
          <Alert tone="info" label={copy.alreadyCounted} className="mt-5">
            {copy.alreadyCountedBody}
          </Alert>
        )}
        {state.status === "unavailable" && (
          <Alert tone="warning" label={copy.dateUnavailable} className="mt-5">
            {copy.dateUnavailableBody}
          </Alert>
        )}

        {!progress.succeeded && availableDates.length > 0 && (
          <form
            action={action}
            aria-label={copy.minimumHeading}
            className="mt-6"
          >
            <input type="hidden" name="intent" value="complete" />
            <input type="hidden" name="challenge" value={challenge} />
            <div className="grid gap-4 sm:grid-cols-2">
              <HabitCheckbox
                name="cueCompleted"
                label={copy.cueCheckbox}
                theme={theme}
              />
              <HabitCheckbox
                name="minimumCompleted"
                label={copy.minimumCheckbox}
                theme={theme}
              />
            </div>
            <label className="mt-4 block max-w-sm font-semibold text-text-strong">
              {copy.cycleDate}
              <select
                name="cycleDate"
                className="mt-2 block w-full rounded-control border border-separator bg-surface-elevation-1 p-3"
                defaultValue={availableDates.at(-1)}
              >
                {availableDates.map((date) => (
                  <option key={date} value={date}>
                    {formatLocalDate(date, locale)}
                  </option>
                ))}
              </select>
            </label>
            {state.status === "incomplete" && (
              <Alert
                tone="warning"
                label={copy.minimumHeading}
                className="mt-5"
              >
                {copy.incomplete}
              </Alert>
            )}
            <Button
              type="submit"
              color={theme.buttonColor}
              size="lg"
              isLoading={isPending}
              loadingLabel={copy.loading}
              className={`mt-6 w-full sm:w-auto ${theme.buttonClass}`}
            >
              {progress.completedCycles === 0
                ? copy.complete
                : copy.recordCycle}
            </Button>
          </form>
        )}

        {progress.completedCycles > 0 && (
          <div className="mt-6 border-t border-separator pt-5">
            <Heading
              level={3}
              size="xs"
              tone="inherit"
              className="text-text-strong"
            >
              {copy.gardenSharingTitle}
            </Heading>
            <p className="mt-1 max-w-2xl text-sm text-body">
              {copy.gardenSharingBody}
            </p>
            <form action={action} className="mt-3">
              <input
                type="hidden"
                name="intent"
                value={
                  progress.gardenSharingEnabled
                    ? "garden-withdraw"
                    : "garden-share"
                }
              />
              <input type="hidden" name="challenge" value={challenge} />
              <Button
                type="submit"
                color={
                  progress.gardenSharingEnabled ? "default" : theme.buttonColor
                }
                className={
                  progress.gardenSharingEnabled ? undefined : theme.buttonClass
                }
                isLoading={isPending}
                loadingLabel={copy.loading}
              >
                {progress.gardenSharingEnabled
                  ? copy.gardenSharingWithdraw
                  : copy.gardenSharingEnable}
              </Button>
            </form>
          </div>
        )}
      </section>

      <HabitChallengeCelebrations
        progress={progress}
        action={action}
        pending={isPending}
        copy={copy}
        theme={theme}
        challenge={challenge}
      />
    </div>
  );
}

function HabitCheckbox({
  name,
  label,
  theme,
}: {
  name: string;
  label: string;
  theme: HabitChallengeThemeConfig;
}): React.ReactNode {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-card border border-separator bg-surface-elevation-1 p-4 text-left transition focus-within:ring-2 focus-within:ring-(--focus-ring) ${theme.checkboxHover}`}
    >
      <input
        type="checkbox"
        name={name}
        className={`mt-1 size-5 ${theme.accent}`}
      />
      <span className="font-semibold text-text-strong">{label}</span>
    </label>
  );
}

function SignInLink({
  href,
  label,
}: {
  href: string;
  label: string;
}): React.ReactNode {
  return (
    <div className="mt-8 text-center">
      <a
        href={href}
        className="focus-ring inline-flex rounded-control bg-pw-green px-6 py-4 font-semibold text-white hover:bg-pw-green/80"
      >
        {label}
      </a>
    </div>
  );
}

function formatLocalDate(localDate: LocalDate, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(new Date(`${localDate}T12:00:00Z`));
}
