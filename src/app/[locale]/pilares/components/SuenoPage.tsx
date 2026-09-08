import { useTranslations } from "next-intl";
import type { AppLocale } from "~/i18n/routing";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { Heading } from "~/presentation/design_system/typography/Heading";
import PillarArticle, {
  LabeledItem,
  PillarCallout,
  PillarPanel,
  PillarSectionHeading,
} from "./PillarArticle";
import PillarBibliography from "./PillarBibliography";
import PillarCatalogSection from "./PillarCatalogSection";
import PillarLocal from "./PillarLocal";
import PillarPractice from "./PillarPractice";
import SleepMentalUnload from "./SleepMentalUnload";
import SleepPillarBridges from "./SleepPillarBridges";
import SleepSanctuary from "./SleepSanctuary";

export default function SuenoPage({ locale }: { locale: AppLocale }) {
  const t = useTranslations("pillarPages.sleep");
  const challengeT = useTranslations("atomicSleepChallenge");
  const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

  return (
    <PillarArticle
      challenge="sleep"
      heading={t("heading")}
      subtitle={t("subtitle")}
      identity={challengeT("identity")}
    >
      <section>
        <PillarSectionHeading>{t("lightHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("lightIntro")}</p>

        <PillarPanel pillar="sleep">
          <LabeledItem label={t("changeLabel")} text={t("changeText")} />
          <LabeledItem label={t("impactLabel")} text={t("impactText")} />
        </PillarPanel>
      </section>

      {/* El costo va junto a su contrapeso, como en los otros tres pilares. */}
      <section>
        <PillarSectionHeading>{t("hiddenCostHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("hiddenCostIntro")}</p>

        <PillarPanel pillar="sleep">
          <LabeledItem
            label={t("fragmentedLabel")}
            text={t("fragmentedText")}
          />
          <LabeledItem label={t("stimulantLabel")} text={t("stimulantText")} />
          <LabeledItem
            label={t("lightPollutionLabel")}
            text={t("lightPollutionText")}
          />
        </PillarPanel>

        <Heading level={3}>{t("localSolutionHeading")}</Heading>
        <PillarCallout pillar="sleep">{t("localSolutionText")}</PillarCallout>
      </section>

      <PillarPractice challenge="sleep" locale={locale} />

      {/* El descanso también se abastece cerca: textiles, luz, quien acompañe. Va pegada a la
          práctica, como en los otros tres. */}
      <PillarLocal challenge="sleep" locale={locale} />

      {/* La guía va después de la práctica: quien ya se comprometió con las dos anclas es quien
          necesita saber cómo dejar el cuarto y la cabeza listos. */}
      <SleepSanctuary />

      <SleepMentalUnload />

      <PillarCatalogSection
        pillar="sleep"
        locale={locale}
        heading={t("catalogHeading")}
        intro={t("catalogIntro")}
        bodyLabel={t("catalogBodyLabel")}
        localLabel={t("catalogLocalLabel")}
      />

      {/* Los puentes cierran el círculo de los cuatro pilares, y por eso van al final: se leen
          mejor cuando ya se entendió qué protege el descanso. */}
      <SleepPillarBridges />

      <section>
        <PillarSectionHeading>{t("processesHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("processesIntro")}</p>
        <ul className="list-disc pl-6 space-y-3 text-text-support text-lg mb-8">
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

      {/* La bibliografía sale de la base: cada estudio con su título, su revista y su año, y
          diciendo qué práctica sostiene. Los DOIs pelados de `references.ts` sólo sobreviven como
          semilla; ver `docs/features/wellbeing/027-2026-09-04-base-de-datos-de-practicas.md`. */}
      <PillarBibliography pillar="sleep" locale={locale} />
    </PillarArticle>
  );
}
