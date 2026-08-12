import { HABIT_CHALLENGE_EXPERIENCES } from "~/domain/habits/habitChallengeExperiences";
import { getPathname } from "~/i18n/navigation";
import { pillarHref } from "~/i18n/routes";
import type { AppLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { SIGNIN_PATH } from "~/infra/constants";
import { createHabitChallengeRepository } from "~/infra/dataAccess/habits/PostgresAtomicSleepChallengeRepository";
import DeepHabitChallengeExperience from "~/presentation/habits/DeepHabitChallengeExperience";
import type { DeepHabitChallengeKey } from "~/presentation/habits/deepHabitChallengeCopy";
import AtomicSleepChallengeUseCase from "~/use_cases/habits/atomicSleepChallengeUseCase";
import { manageCuratedHabitChallenge } from "../curatedHabitChallengeActions";

export default async function CuratedPracticeSection({
  challenge,
  locale,
}: {
  challenge: DeepHabitChallengeKey;
  locale: AppLocale;
}): Promise<React.ReactNode> {
  const experience = HABIT_CHALLENGE_EXPERIENCES[challenge];
  const userId = await readViewerId();
  const progress = userId
    ? await new AtomicSleepChallengeUseCase(
        createHabitChallengeRepository(experience.challengeKey),
      ).getProgress(userId)
    : null;
  const returnPath = getPathname({
    locale,
    href: pillarHref(experience.slug),
  });
  const signInPath = getPathname({ locale, href: SIGNIN_PATH });

  return (
    <DeepHabitChallengeExperience
      action={manageCuratedHabitChallenge}
      challenge={challenge}
      progress={progress}
      signedIn={userId !== null}
      signInHref={`${signInPath}?callbackUrl=${encodeURIComponent(returnPath)}`}
    />
  );
}
