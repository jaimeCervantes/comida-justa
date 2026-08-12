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
import { MIND_SPIRIT_REFERENCES } from "./references";

export default function MenteEspirituPage({ locale }: { locale: AppLocale }) {
  const t = useTranslations("pillarPages.mindSpirit");
  const tChallenge = useTranslations("atomicChallenges.mindExperience");

  return (
    <PillarArticle
      challenge="mind"
      heading={t("heading")}
      subtitle={t("subtitle")}
      identity={tChallenge("identity")}
    >
      <section>
        <PillarSectionHeading>{t("breakHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("breakIntro")}</p>

        <PillarPanel pillar="mindSpirit">
          <LabeledItem label={t("changeLabel")} text={t("changeText")} />
          <LabeledItem label={t("impactLabel")} text={t("impactText")} />
        </PillarPanel>
      </section>

      <PillarPractice challenge="mind" locale={locale} />

      <section>
        <PillarSectionHeading>{t("mismatchHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("mismatchIntro")}</p>
        <p className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
          {t("modernOffers")}
        </p>
        <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300 text-lg mb-8">
          <li>{t("offer1")}</li>
          <li>{t("offer2")}</li>
          <li>{t("offer3")}</li>
        </ul>

        <PillarCallout pillar="mindSpirit">{t("callout")}</PillarCallout>
      </section>

      <PillarReferences
        pillar="mindSpirit"
        references={MIND_SPIRIT_REFERENCES}
      />
    </PillarArticle>
  );
}
