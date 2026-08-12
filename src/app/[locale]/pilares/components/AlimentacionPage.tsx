import { useTranslations } from "next-intl";
import type { AppLocale } from "~/i18n/routing";
import { Heading } from "~/presentation/design_system/typography/Heading";
import NutritionCleanCooking from "./NutritionCleanCooking";
import NutritionIngredientCatalog from "./NutritionIngredientCatalog";
import NutritionPillarBridges from "./NutritionPillarBridges";
import NutritionPlateTriad from "./NutritionPlateTriad";
import PillarArticle, {
  LabeledItem,
  PillarCallout,
  PillarPanel,
  PillarSectionHeading,
} from "./PillarArticle";
import PillarPractice from "./PillarPractice";
import PillarReferences from "./PillarReferences";
import { NUTRITION_REFERENCES } from "./references";

export default function AlimentacionPage({ locale }: { locale: AppLocale }) {
  const t = useTranslations("pillarPages.nutrition");
  const tChallenge = useTranslations("atomicChallenges.nutritionExperience");

  return (
    <PillarArticle
      challenge="nutrition"
      heading={t("heading")}
      subtitle={t("subtitle")}
      identity={tChallenge("identity")}
    >
      <section>
        <PillarSectionHeading>{t("breakHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("breakIntro")}</p>

        <PillarPanel pillar="nutrition">
          <LabeledItem label={t("changeLabel")} text={t("changeText")} />
          <LabeledItem label={t("impactLabel")} text={t("impactText")} />
        </PillarPanel>
      </section>

      {/* El costo del viaje va junto a su contrapeso y no en otra sección: separarlos convertía la
          proximidad en una preferencia estética en vez de en la respuesta a un costo concreto. */}
      <section>
        <PillarSectionHeading>{t("hiddenCostHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("hiddenCostIntro")}</p>

        <PillarPanel pillar="nutrition">
          <LabeledItem label={t("transportLabel")} text={t("transportText")} />
          <LabeledItem label={t("packagingLabel")} text={t("packagingText")} />
          <LabeledItem label={t("wasteLabel")} text={t("wasteText")} />
        </PillarPanel>

        <Heading level={3}>{t("localSolutionHeading")}</Heading>
        <PillarCallout pillar="nutrition">
          {t("localSolutionText")}
        </PillarCallout>
      </section>

      <PillarPractice challenge="nutrition" locale={locale} />

      {/* La guía va después de la práctica y no antes: quien acaba de comprometerse con la cena es
          quien necesita saber en qué proporción sirve el plato y con qué lo cocina. */}
      <NutritionPlateTriad />

      <NutritionCleanCooking />

      <NutritionIngredientCatalog />

      {/* Los puentes cierran la pagina: se leen mejor cuando ya se entendio la practica. */}
      <NutritionPillarBridges />

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

      <PillarReferences pillar="nutrition" references={NUTRITION_REFERENCES} />
    </PillarArticle>
  );
}
