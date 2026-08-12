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
import { MOVEMENT_REFERENCES } from "./references";

export default function MovimientoPage({ locale }: { locale: AppLocale }) {
  const t = useTranslations("pillarPages.movement");
  const tChallenge = useTranslations("atomicChallenges.movementExperience");
  const theme = getDeepHabitChallengeTheme("movement");

  return (
    <PillarArticle
      pillar="movement"
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

        <PillarPanel pillar="movement">
          <LabeledItem label={t("changeLabel")} text={t("changeText")} />
          <LabeledItem label={t("impactLabel")} text={t("impactText")} />
        </PillarPanel>
      </section>

      <CuratedPracticeSection challenge="movement" locale={locale} />

      <section>
        <PillarCallout pillar="movement">{t("callout")}</PillarCallout>
      </section>

      <PillarReferences pillar="movement" references={MOVEMENT_REFERENCES} />
    </PillarArticle>
  );
}
