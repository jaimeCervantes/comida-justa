import { useTranslations } from "next-intl";
import PillarArticle, { LabeledItem, PillarCallout } from "./PillarArticle";
import PillarReferences from "./PillarReferences";
import { MIND_SPIRIT_REFERENCES } from "./references";

export default function MenteEspirituPage() {
  const t = useTranslations("pillarPages.mindSpirit");

  return (
    <PillarArticle
      heading={t("heading")}
      subtitle={t("subtitle")}
      headingClassName="text-sky-400"
    >
      <section>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
          {t("breakHeading")}
        </h2>
        <p className="mb-4">{t("breakIntro")}</p>

        <div className="bg-sky-50/50 dark:bg-sky-900/10 rounded-2xl p-6 sm:p-8 my-8 border border-sky-500 dark:border-sky-800 shadow-xs">
          <ul className="space-y-6">
            <LabeledItem label={t("changeLabel")} text={t("changeText")} />
            <LabeledItem label={t("impactLabel")} text={t("impactText")} />
          </ul>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
          {t("mismatchHeading")}
        </h3>
        <p className="mb-4">{t("mismatchIntro")}</p>
        <p className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
          {t("modernOffers")}
        </p>
        <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300 text-lg mb-8">
          <li>{t("offer1")}</li>
          <li>{t("offer2")}</li>
          <li>{t("offer3")}</li>
        </ul>

        <PillarCallout className="bg-sky-50/80 dark:bg-sky-900/20 border-sky-500 dark:border-sky-400">
          <p className="text-sky-900 dark:text-sky-100 text-lg m-0">
            {t("callout")}
          </p>
        </PillarCallout>
      </section>

      <PillarReferences
        references={MIND_SPIRIT_REFERENCES}
        linkClassName="text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 underline transition-colors"
      />
    </PillarArticle>
  );
}
