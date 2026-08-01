import { useTranslations } from "next-intl";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import PillarArticle, { LabeledItem, PillarCallout } from "./PillarArticle";
import PillarReferences from "./PillarReferences";
import { SLEEP_REFERENCES } from "./references";

export default function SuenoPage() {
  const t = useTranslations("pillarPages.sleep");
  const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

  return (
    <PillarArticle
      heading={t("heading")}
      subtitle={t("subtitle")}
      headingClassName="text-violet-500"
    >
      <section>
        <h2 className="text-2xl font-bold text-slate-900 da dark:text-slate-50 mb-4">
          {t("lightHeading")}
        </h2>
        <p className="mb-4">{t("lightIntro")}</p>

        <div className="bg-violet-50/50 da dark:bg-violet-900/10 rounded-2xl p-6 sm:p-8 my-8 border border-violet-500 da dark:border-violet-800 shadow-xs">
          <ul className="space-y-6">
            <LabeledItem label={t("changeLabel")} text={t("changeText")} />
            <LabeledItem label={t("impactLabel")} text={t("impactText")} />
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 da dark:text-slate-50 mb-4">
          {t("processesHeading")}
        </h2>
        <p className="mb-4">{t("processesIntro")}</p>
        <ul className="list-disc pl-6 space-y-3 text-slate-700 da dark:text-slate-300 text-lg mb-8">
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

        <PillarCallout className="bg-violet-50/da dark:bg-violet-900 border-violet-500 da dark:border-violet-400">
          <p className="text-violet-900 dark:text-violet-100xt-lg m-0">
            {t.rich("callout", { b: bold, brand: PUBLIC_BRAND_NAME })}
          </p>
        </PillarCallout>
      </section>

      <PillarReferences
        references={SLEEP_REFERENCES}
        linkClassName="text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 underline transition-colors"
      />
    </PillarArticle>
  );
}
