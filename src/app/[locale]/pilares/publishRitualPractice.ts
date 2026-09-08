import { getTranslations } from "next-intl/server";
import type { HabitChallengeExperience } from "~/domain/habits/habitChallengeExperiences";
import {
  practiceDaySlug,
  ritualPracticeKey,
} from "~/domain/practices/practiceDayPost";
import type { AppLocale } from "~/i18n/routing";
import { publishPracticeDayPost } from "../publishPracticeDayPost";

/**
 * La publicación que deja un día de ritual.
 *
 * Nace sin media —el ritual no pide foto y obligarla convertiría practicar en un trámite— y el
 * texto sale del catálogo de retos, el mismo que lee el panel: así la publicación dice qué ritual
 * fue y cuál era su mínimo sin que nadie escriba nada.
 */
export async function publishRitualPractice({
  experience,
  userId,
  cycleDate,
  locale,
}: {
  experience: HabitChallengeExperience;
  userId: string;
  cycleDate: string;
  locale: AppLocale;
}): Promise<void> {
  const t = await getTranslations({ locale, namespace: "atomicChallenges" });
  /* `experienceKey` es una unión cerrada de cuatro, así que la clave compuesta sigue siendo
     encontrable con grep y `typecheck` la valida. */
  const ritual = t(`${experience.experienceKey}.title`);

  await publishPracticeDayPost({
    slug: practiceDaySlug({
      practiceKey: ritualPracticeKey(experience.challengeKey),
      cycleDate,
      userId,
    }),
    title: t("experienceCommon.practicePostTitle", { ritual }),
    content: t("experienceCommon.practicePostBody", {
      minimum: t(`${experience.experienceKey}.minimum`),
    }),
    category: experience.categoryKey,
    userId,
    locale,
  });
}
