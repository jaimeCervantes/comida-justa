import { useTranslations } from "next-intl";
import PillarArticle, {
  LabeledItem,
  PillarCallout,
  PillarPanel,
  PillarSectionHeading,
} from "./PillarArticle";
import PillarReferences from "./PillarReferences";
import { MOVEMENT_REFERENCES } from "./references";

export default function MovimientoPage() {
  const t = useTranslations("pillarPages.movement");

  return (
    <PillarArticle
      pillar="movement"
      heading={t("heading")}
      subtitle={t("subtitle")}
    >
      <section>
        <PillarSectionHeading>{t("breakHeading")}</PillarSectionHeading>
        <p className="mb-4">{t("breakIntro")}</p>

        <PillarPanel pillar="movement">
          <LabeledItem label={t("changeLabel")} text={t("changeText")} />
          <LabeledItem label={t("impactLabel")} text={t("impactText")} />
        </PillarPanel>
      </section>

      <section>
        <PillarCallout pillar="movement">{t("callout")}</PillarCallout>
      </section>

      <PillarReferences pillar="movement" references={MOVEMENT_REFERENCES} />
    </PillarArticle>
  );
}
