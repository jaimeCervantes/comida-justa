import { useTranslations } from "next-intl";
import type { AppLocale } from "~/i18n/routing";
import { Heading } from "~/presentation/design_system/typography/Heading";
import MindGroundingAndBreath from "./MindGroundingAndBreath";
import MindPillarBridges from "./MindPillarBridges";
import MindPracticeCatalog from "./MindPracticeCatalog";
import MindSilenceWindows from "./MindSilenceWindows";
import PillarArticle, {
  LabeledItem,
  PillarCallout,
  PillarPanel,
  PillarSectionHeading,
} from "./PillarArticle";
import PillarBibliography from "./PillarBibliography";
import PillarLocal from "./PillarLocal";
import PillarPractice from "./PillarPractice";

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

      {/* El costo va junto a su contrapeso, como en los otros tres pilares: separarlos convertía el
          silencio en una preferencia y no en la respuesta a algo que ya se está pagando. */}
      <section>
        <PillarSectionHeading>{t("hiddenCostHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("hiddenCostIntro")}</p>

        <PillarPanel pillar="mindSpirit">
          <LabeledItem label={t("overloadLabel")} text={t("overloadText")} />
          <LabeledItem label={t("uprootLabel")} text={t("uprootText")} />
          <LabeledItem
            label={t("lonelinessLabel")}
            text={t("lonelinessText")}
          />
        </PillarPanel>

        <Heading level={3}>{t("localSolutionHeading")}</Heading>
        <PillarCallout pillar="mindSpirit">
          {t("localSolutionText")}
        </PillarCallout>
      </section>

      <PillarPractice challenge="mind" locale={locale} />

      {/* El vínculo que pide el ritual necesita gente y sitios concretos, no una recomendación
          genérica de "busca comunidad". Va pegada a la práctica. */}
      <PillarLocal challenge="mind" locale={locale} />

      {/* La guía va después de la práctica: quien ya se comprometió con el silencio y la
          conversación es quien necesita saber en qué ratos del día caben. */}
      <MindSilenceWindows />

      <MindGroundingAndBreath />

      <MindPracticeCatalog />

      {/* Los puentes cierran la pagina: se leen mejor cuando ya se entendio la practica. */}
      <MindPillarBridges />

      <section>
        <PillarSectionHeading>{t("mismatchHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("mismatchIntro")}</p>
        <p className="font-semibold text-text-base mb-2">{t("modernOffers")}</p>
        <ul className="list-disc pl-6 space-y-2 text-text-support text-lg mb-8">
          <li>{t("offer1")}</li>
          <li>{t("offer2")}</li>
          <li>{t("offer3")}</li>
        </ul>

        <PillarCallout pillar="mindSpirit">{t("callout")}</PillarCallout>
      </section>

      <PillarBibliography pillar="mindSpirit" locale={locale} />
    </PillarArticle>
  );
}
