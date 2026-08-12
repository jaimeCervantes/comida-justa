import { useTranslations } from "next-intl";
import PillarBridges, { type PillarBridge } from "./PillarBridges";

/**
 * Cómo se conecta Mente y Espíritu con los otros tres.
 *
 * Sus dos ventanas de silencio son también las de otros pilares: la de la mesa es la cena de
 * Alimentación, y la última hora es la frontera que protege el sueño en el Pilar 1.
 */
export default function MindPillarBridges(): React.ReactNode {
  const t = useTranslations("pillarPages.mindSpirit");

  const bridges: readonly PillarBridge[] = [
    {
      to: "sleep",
      title: t("bridgeSleepTitle"),
      body: t("bridgeSleepBody"),
    },
    {
      to: "nutrition",
      title: t("bridgeNutritionTitle"),
      body: t("bridgeNutritionBody"),
    },
    {
      to: "movement",
      title: t("bridgeMovementTitle"),
      body: t("bridgeMovementBody"),
    },
  ];

  return (
    <PillarBridges
      heading={t("bridgeHeading")}
      intro={t("bridgeIntro")}
      linkLabel={t("bridgeLink")}
      bridges={bridges}
    />
  );
}
