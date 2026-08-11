import { useTranslations } from "next-intl";
import AtomicChallengeCta from "~/presentation/habits/AtomicChallengeCta";
import PillarArticle, {
  LabeledItem,
  PillarCallout,
  PillarPanel,
  PillarSectionHeading,
} from "./PillarArticle";
import PillarReferences from "./PillarReferences";
import { NUTRITION_REFERENCES } from "./references";

export default function AlimentacionPage() {
  const t = useTranslations("pillarPages.nutrition");
  const tChallenge = useTranslations("atomicChallenges.nutrition");

  return (
    <PillarArticle
      pillar="nutrition"
      heading={t("heading")}
      subtitle={t("subtitle")}
    >
      <section>
        <PillarSectionHeading>{t("breakHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("breakIntro")}</p>

        <PillarPanel pillar="nutrition">
          <LabeledItem label={t("changeLabel")} text={t("changeText")} />
          <LabeledItem label={t("impactLabel")} text={t("impactText")} />
        </PillarPanel>
      </section>

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

      <AtomicChallengeCta
        href="/habitos/alimentacion"
        title={tChallenge("cta")}
        body={tChallenge("intro")}
      />
      <PillarReferences pillar="nutrition" references={NUTRITION_REFERENCES} />
    </PillarArticle>
  );
}
