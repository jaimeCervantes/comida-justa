import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { findCuratedChallenge } from "~/domain/habits/curatedChallenges";
import { findHabitChallengeExperience } from "~/domain/habits/habitChallengeExperiences";
import { getPathname } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { SIGNIN_PATH } from "~/infra/constants";
import { createHabitChallengeRepository } from "~/infra/dataAccess/habits/PostgresAtomicSleepChallengeRepository";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";
import DeepHabitChallengeExperience from "~/presentation/habits/DeepHabitChallengeExperience";
import AtomicSleepChallengeUseCase from "~/use_cases/habits/atomicSleepChallengeUseCase";
import { manageCuratedHabitChallenge } from "./actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const challenge = findCuratedChallenge(slug);
  if (!challenge || challenge.slug === "sueno") return {};
  const t = await getTranslations({ locale, namespace: "atomicChallenges" });
  const experience = findHabitChallengeExperience(slug);
  if (experience?.experienceKey === "nutrition") {
    return {
      title: t("nutritionExperience.metaTitle"),
      description: t("nutritionExperience.metaDescription"),
      alternates: localizedAlternates(experience.path, locale),
    };
  }
  if (experience?.experienceKey === "movement") {
    return {
      title: t("movementExperience.metaTitle"),
      description: t("movementExperience.metaDescription"),
      alternates: localizedAlternates(experience.path, locale),
    };
  }
  if (experience?.experienceKey === "mind") {
    return {
      title: t("mindExperience.metaTitle"),
      description: t("mindExperience.metaDescription"),
      alternates: localizedAlternates(experience.path, locale),
    };
  }
  return {};
}

export default async function CuratedChallengePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<React.ReactNode> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const challenge = findCuratedChallenge(slug);
  if (!challenge || challenge.slug === "sueno") notFound();
  const userId = await readViewerId();
  const experience = findHabitChallengeExperience(slug);
  if (!experience || experience.experienceKey === "sleep") notFound();
  const progress = userId
    ? await new AtomicSleepChallengeUseCase(
        createHabitChallengeRepository(experience.challengeKey),
      ).getProgress(userId)
    : null;
  const returnPath = getPathname({ locale, href: experience.path });
  const signInPath = getPathname({ locale, href: SIGNIN_PATH });

  return (
    <DeepHabitChallengeExperience
      action={manageCuratedHabitChallenge}
      challenge={experience.experienceKey}
      progress={progress}
      signedIn={userId !== null}
      signInHref={`${signInPath}?callbackUrl=${encodeURIComponent(returnPath)}`}
    />
  );
}
