import { useTranslations } from "next-intl";
import PillarBridges, { type PillarBridge } from "./PillarBridges";

/**
 * Cómo se conecta Movimiento con los otros tres.
 *
 * El puente con Alimentación es el mismo viaje contado dos veces —el mandado a pie es el ancla de
 * aquí y el abastecimiento de allá—, y el rato al aire libre lo comparte con Mente.
 */
export default function MovementPillarBridges(): React.ReactNode {
  const t = useTranslations("pillarPages.movement");

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
      to: "mindSpirit",
      title: t("bridgeMindTitle"),
      body: t("bridgeMindBody"),
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
