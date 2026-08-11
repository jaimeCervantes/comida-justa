import { useTranslations } from "next-intl";
import AtomicChallengeCta from "~/presentation/habits/AtomicChallengeCta";
import PillarArticle, {
  LabeledItem,
  PillarCallout,
  PillarPanel,
  PillarSectionHeading,
} from "./PillarArticle";
import PillarReferences from "./PillarReferences";
import { MIND_SPIRIT_REFERENCES } from "./references";

export default function MenteEspirituPage() {
  const t = useTranslations("pillarPages.mindSpirit");
  const tChallenge = useTranslations("atomicChallenges.mind");

  return (
    <PillarArticle
      pillar="mindSpirit"
      heading={t("heading")}
      subtitle={t("subtitle")}
    >
      <section>
        <PillarSectionHeading>{t("breakHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("breakIntro")}</p>

        <PillarPanel pillar="mindSpirit">
          <LabeledItem label={t("changeLabel")} text={t("changeText")} />
          <LabeledItem label={t("impactLabel")} text={t("impactText")} />
        </PillarPanel>
      </section>

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

      <AtomicChallengeCta
        href="/habitos/mente-espiritu"
        title={tChallenge("cta")}
        body={tChallenge("intro")}
      />
      <PillarReferences
        pillar="mindSpirit"
        references={MIND_SPIRIT_REFERENCES}
      />
    </PillarArticle>
  );
}
