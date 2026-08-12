import { useTranslations } from "next-intl";
import type { AppLocale } from "~/i18n/routing";
import { getDeepHabitChallengeTheme } from "~/presentation/habits/deepHabitChallengeThemes";
import PillarHero from "~/presentation/habits/PillarHero";
import CuratedPracticeSection from "./CuratedPracticeSection";
import PillarArticle, {
  LabeledItem,
  PillarCallout,
  PillarPanel,
  PillarSectionHeading,
} from "./PillarArticle";
import PillarReferences from "./PillarReferences";
import { NUTRITION_REFERENCES } from "./references";

export default function AlimentacionPage({ locale }: { locale: AppLocale }) {
  const t = useTranslations("pillarPages.nutrition");
  const tChallenge = useTranslations("atomicChallenges.nutritionExperience");
  const theme = getDeepHabitChallengeTheme("nutrition");

  return (
    <PillarArticle
      pillar="nutrition"
      heading={t("heading")}
      subtitle={t("subtitle")}
      header={
        <PillarHero
          level={1}
          title={t("heading")}
          intro={t("subtitle")}
          identity={tChallenge("identity")}
          theme={theme}
          className="mb-10 rounded-[2rem] shadow-xl"
        />
      }
    >
      <section>
        <PillarSectionHeading>{t("breakHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("breakIntro")}</p>

        <PillarPanel pillar="nutrition">
          <LabeledItem label={t("changeLabel")} text={t("changeText")} />
          <LabeledItem label={t("impactLabel")} text={t("impactText")} />
        </PillarPanel>
      </section>

      <CuratedPracticeSection challenge="nutrition" locale={locale} />

      <section>
        <p className="mb-6">{t("evidence")}</p>

        <PillarCallout pillar="nutrition">{t("callout")}</PillarCallout>
      </section>

      <section>
        <PillarSectionHeading>{t("includesHeading")}</PillarSectionHeading>
        <ul className="list-disc pl-6 space-y-3 text-slate-700 dark:text-slate-300 text-lg">
          <li>{t("includes1")}</li>
          <li>{t("includes2")}</li>
          <li>{t("includes3")}</li>
        </ul>
      </section>

      <PillarReferences pillar="nutrition" references={NUTRITION_REFERENCES} />
    </PillarArticle>
  );
}
