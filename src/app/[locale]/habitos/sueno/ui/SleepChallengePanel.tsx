"use client";

import HabitChallengePanel from "~/presentation/habits/HabitChallengePanel";
import type { AtomicSleepProgress } from "~/use_cases/habits/atomicSleepChallengeUseCase";
import { manageAtomicSleepChallenge } from "../actions";

export default function SleepChallengePanel({
  initialProgress,
  signedIn,
  signInHref,
}: {
  initialProgress: AtomicSleepProgress | null;
  signedIn: boolean;
  signInHref: string;
}): React.ReactNode {
  return (
    <HabitChallengePanel
      action={manageAtomicSleepChallenge}
      challenge="sleep"
      initialProgress={initialProgress}
      signedIn={signedIn}
      signInHref={signInHref}
    />
  );
}
