import { useTranslations } from "next-intl";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import AtomicChallengeCta from "~/presentation/habits/AtomicChallengeCta";
import PillarArticle, {
  LabeledItem,
  PillarCallout,
  PillarPanel,
  PillarSectionHeading,
} from "./PillarArticle";
import PillarReferences from "./PillarReferences";
import { SLEEP_REFERENCES } from "./references";

export default function SuenoPage() {
  const t = useTranslations("pillarPages.sleep");
  const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

  return (
    <PillarArticle
      pillar="sleep"
      heading={t("heading")}
      subtitle={t("subtitle")}
    >
      <section>
        <PillarSectionHeading>{t("lightHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("lightIntro")}</p>

        <PillarPanel pillar="sleep">
          <LabeledItem label={t("changeLabel")} text={t("changeText")} />
          <LabeledItem label={t("impactLabel")} text={t("impactText")} />
        </PillarPanel>
      </section>

      <section>
        <PillarSectionHeading>{t("processesHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("processesIntro")}</p>
        <ul className="list-disc pl-6 space-y-3 text-slate-700 dark:text-slate-300 text-lg mb-8">
          <li>
            <strong>{t("brainLabel")}</strong> {t("brainText")}
          </li>
          <li>
            <strong>{t("metabolismLabel")}</strong> {t("metabolismText")}
          </li>
          <li>
            <strong>{t("immuneLabel")}</strong> {t("immuneText")}
          </li>
          <li>
            <strong>{t("cardiovascularLabel")}</strong>{" "}
            {t("cardiovascularText")}
          </li>
          <li>
            <strong>{t("homeostasisLabel")}</strong> {t("homeostasisText")}
          </li>
        </ul>
      </section>

      <section>
        <p className="mb-6">{t.rich("evidence", { b: bold })}</p>

        <PillarCallout pillar="sleep">
          {t.rich("callout", { b: bold, brand: PUBLIC_BRAND_NAME })}
        </PillarCallout>
      </section>

      <AtomicChallengeCta
        href="/habitos/sueno"
        title={t("challengeCta")}
        body={t("challengeIntro")}
      />
      <PillarReferences pillar="sleep" references={SLEEP_REFERENCES} />
    </PillarArticle>
  );
}
