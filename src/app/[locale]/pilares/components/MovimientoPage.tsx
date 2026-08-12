import { useTranslations } from "next-intl";
import type { AppLocale } from "~/i18n/routing";
import { Heading } from "~/presentation/design_system/typography/Heading";
import MovementCatalog from "./MovementCatalog";
import MovementDailyCadence from "./MovementDailyCadence";
import MovementFootAndTerrain from "./MovementFootAndTerrain";
import MovementPillarBridges from "./MovementPillarBridges";
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

      {/* El costo del trayecto motorizado va junto a su contrapeso, como en Alimentación:
          separarlos convertía la movilidad activa en una preferencia y no en la respuesta a algo
          que ya se está pagando. */}
      <section>
        <PillarSectionHeading>{t("hiddenCostHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("hiddenCostIntro")}</p>

        <PillarPanel pillar="movement">
          <LabeledItem label={t("fuelLabel")} text={t("fuelText")} />
          <LabeledItem label={t("airLabel")} text={t("airText")} />
          <LabeledItem label={t("vitalityLabel")} text={t("vitalityText")} />
        </PillarPanel>

        <Heading level={3}>{t("localSolutionHeading")}</Heading>
        <PillarCallout pillar="movement">
          {t("localSolutionText")}
        </PillarCallout>
      </section>

      <PillarPractice challenge="movement" locale={locale} />

      {/* La guía va después de la práctica: quien ya se comprometió con el trayecto y los dos
          minutos es quien necesita saber cada cuánto vuelve y con qué pisa. */}
      <MovementDailyCadence />

      <MovementFootAndTerrain />

      <MovementCatalog />

      {/* Los puentes cierran la pagina: se leen mejor cuando ya se entendio la practica. */}
      <MovementPillarBridges />

      <section>
        <PillarCallout pillar="movement">{t("callout")}</PillarCallout>
      </section>

      <PillarReferences pillar="movement" references={MOVEMENT_REFERENCES} />
    </PillarArticle>
  );
}
