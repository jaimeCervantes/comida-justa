import type { AtomicSleepProgress } from "~/use_cases/habits/atomicSleepChallengeUseCase";
import DeepHabitPracticeContent from "./DeepHabitPracticeContent";
import {
  type DeepHabitChallengeKey,
  getDeepHabitChallengeCopy,
} from "./deepHabitChallengeCopy";
import { getDeepHabitChallengeTheme } from "./deepHabitChallengeThemes";
import type { HabitChallengeAction } from "./HabitChallengePanel";

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
    <DeepHabitPracticeContent
      action={action}
      challenge={challenge}
      copy={copy}
      progress={progress}
      signedIn={signedIn}
      signInHref={signInHref}
      theme={theme}
    />
  );
}
