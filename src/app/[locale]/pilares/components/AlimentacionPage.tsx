import { useTranslations } from "next-intl";
import PillarArticle, { LabeledItem, PillarCallout } from "./PillarArticle";
import PillarReferences from "./PillarReferences";
import { NUTRITION_REFERENCES } from "./references";

export default function AlimentacionPage() {
  const t = useTranslations("pillarPages.nutrition");

  return (
    <PillarArticle
      heading={t("heading")}
      subtitle={t("subtitle")}
      headingClassName="text-pw-orange"
    >
      <section>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
          {t("breakHeading")}
        </h2>
        <p className="mb-4">{t("breakIntro")}</p>

        <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl p-6 sm:p-8 my-8 border border-orange-100 dark:border-orange-800/30 shadow-xs">
          <ul className="space-y-6">
            <LabeledItem label={t("changeLabel")} text={t("changeText")} />
            <LabeledItem label={t("impactLabel")} text={t("impactText")} />
          </ul>
        </div>
      </section>

      <section>
        <p className="mb-6">{t("evidence")}</p>

        <PillarCallout className="bg-orange-50/80 dark:bg-orange-900/20 border-orange-500 dark:border-orange-400">
          <p className="text-orange-900 dark:text-orange-100 text-lg m-0">
            {t("callout")}
          </p>
        </PillarCallout>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
          {t("includesHeading")}
        </h3>
        <ul className="list-disc pl-6 space-y-3 text-slate-700 dark:text-slate-300 text-lg">
          <li>{t("includes1")}</li>
          <li>{t("includes2")}</li>
          <li>{t("includes3")}</li>
        </ul>
      </section>

      <PillarReferences
        references={NUTRITION_REFERENCES}
        linkClassName="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 underline transition-colors"
      />
    </PillarArticle>
  );
}
