import { useTranslations } from "next-intl";
import PillarArticle, { LabeledItem, PillarCallout } from "./PillarArticle";
import PillarReferences from "./PillarReferences";
import { MOVEMENT_REFERENCES } from "./references";

export default function MovimientoPage() {
  const t = useTranslations("pillarPages.movement");

  return (
    <PillarArticle
      heading={t("heading")}
      subtitle={t("subtitle")}
      headingClassName="text-pw-lightgreen"
    >
      <section>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
          {t("breakHeading")}
        </h2>
        <p className="mb-4">{t("breakIntro")}</p>

        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl p-6 sm:p-8 my-8 border border-emerald-500 dark:border-emerald-800 shadow-xs">
          <ul className="space-y-6">
            <LabeledItem label={t("changeLabel")} text={t("changeText")} />
            <LabeledItem label={t("impactLabel")} text={t("impactText")} />
          </ul>
        </div>
      </section>

      <section>
        <PillarCallout className="bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-400">
          <p className="text-emerald-900 dark:text-emerald-100 text-lg m-0">
            {t("callout")}
          </p>
        </PillarCallout>
      </section>

      <PillarReferences
        references={MOVEMENT_REFERENCES}
        linkClassName="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline transition-colors"
      />
    </PillarArticle>
  );
}
