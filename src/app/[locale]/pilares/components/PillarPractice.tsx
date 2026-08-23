import {
  HABIT_CHALLENGE_EXPERIENCES,
  type HabitChallengeExperienceKey,
} from "~/domain/habits/habitChallengeExperiences";
import { pillarHref } from "~/i18n/routes";
import type { AppLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { signInPathFor } from "~/infra/auth/signInPath";
import { createHabitChallengeRepository } from "~/infra/dataAccess/habits/PostgresHabitChallengeRepository";
import HabitChallengePanel from "~/presentation/habits/HabitChallengePanel";
import PillarPracticeSection from "~/presentation/habits/PillarPracticeSection";
import { getPillarPracticeCopy } from "~/presentation/habits/pillarPracticeCopy";
import { getPillarTheme } from "~/presentation/habits/pillarThemes";
import HabitChallengeUseCase from "~/use_cases/habits/habitChallengeUseCase";
import { manageHabitChallenge } from "../habitChallengeActions";

/**
 * Lo que la práctica necesita del servidor: quién mira, qué lleva guardado y a dónde volver después
 * de iniciar sesión. Una sola para los cuatro pilares; el reto entra como parámetro.
 *
 * El `key` del panel no es decorativo: `useActionState` congela su estado inicial, así que sin él un
 * progreso que cambió en otra pantalla seguiría mostrándose viejo al volver. Sueño ya lo hacía y los
 * otros tres no; ahora es la misma regla para todos.
 */
export default async function PillarPractice({
  challenge,
  locale,
}: {
  challenge: HabitChallengeExperienceKey;
  locale: AppLocale;
}): Promise<React.ReactNode> {
  const experience = HABIT_CHALLENGE_EXPERIENCES[challenge];
  const userId = await readViewerId();
  const progress = userId
    ? await new HabitChallengeUseCase(
        createHabitChallengeRepository(experience.challengeKey),
      ).getProgress(userId)
    : null;
  const signInHref = signInPathFor(locale, pillarHref(experience.slug));

  return (
    <PillarPracticeSection
      challenge={challenge}
      copy={await getPillarPracticeCopy(challenge)}
      theme={getPillarTheme(challenge)}
      panel={
        <HabitChallengePanel
          key={`${progress?.level ?? "visitor"}-${progress?.celebrationStatus ?? "private"}`}
          action={manageHabitChallenge}
          challenge={challenge}
          initialProgress={progress}
          signedIn={userId !== null}
          signInHref={signInHref}
        />
      }
    />
  );
}
