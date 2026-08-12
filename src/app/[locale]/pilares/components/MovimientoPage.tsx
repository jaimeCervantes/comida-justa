import { useTranslations } from "next-intl";
import type { AppLocale } from "~/i18n/routing";
import PillarArticle, {
  LabeledItem,
  PillarCallout,
  PillarPanel,
  PillarSectionHeading,
} from "./PillarArticle";
import PillarPractice from "./PillarPractice";
import PillarReferences from "./PillarReferences";
import { MOVEMENT_REFERENCES } from "./references";

export default function MovimientoPage({ locale }: { locale: AppLocale }) {
  const t = useTranslations("pillarPages.movement");
  const tChallenge = useTranslations("atomicChallenges.movementExperience");

  return (
    <PillarArticle
      challenge="movement"
      heading={t("heading")}
      subtitle={t("subtitle")}
      identity={tChallenge("identity")}
    >
      <section>
        <PillarSectionHeading>{t("breakHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("breakIntro")}</p>

        <PillarPanel pillar="movement">
          <LabeledItem label={t("changeLabel")} text={t("changeText")} />
          <LabeledItem label={t("impactLabel")} text={t("impactText")} />
        </PillarPanel>
      </section>

      <PillarPractice challenge="movement" locale={locale} />

      <section>
        <PillarCallout pillar="movement">{t("callout")}</PillarCallout>
      </section>

      <PillarReferences pillar="movement" references={MOVEMENT_REFERENCES} />
    </PillarArticle>
  );
}
