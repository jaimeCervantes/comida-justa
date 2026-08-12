import { getPathname } from "~/i18n/navigation";
import { pillarHref } from "~/i18n/routes";
import type { AppLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { SIGNIN_PATH } from "~/infra/constants";
import { createAtomicSleepChallengeRepository } from "~/infra/dataAccess/habits/PostgresAtomicSleepChallengeRepository";
import AtomicSleepChallengeUseCase from "~/use_cases/habits/atomicSleepChallengeUseCase";
import SleepPracticeContent from "./SleepPracticeContent";

export default async function SleepPracticeSection({
  locale,
}: {
  locale: AppLocale;
}): Promise<React.ReactNode> {
  const userId = await readViewerId();
  const progress = userId
    ? await new AtomicSleepChallengeUseCase(
        createAtomicSleepChallengeRepository(),
      ).getProgress(userId)
    : null;
  const returnPath = getPathname({
    locale,
    href: pillarHref("sueno"),
  });
  const signInPath = getPathname({ locale, href: SIGNIN_PATH });

  return (
    <SleepPracticeContent
      initialProgress={progress}
      signedIn={userId !== null}
      signInHref={`${signInPath}?callbackUrl=${encodeURIComponent(returnPath)}`}
    />
  );
}
