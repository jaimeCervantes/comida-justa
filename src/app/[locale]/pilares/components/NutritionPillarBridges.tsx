import { useTranslations } from "next-intl";
import PillarBridges, { type PillarBridge } from "./PillarBridges";

/**
 * Cómo se conecta Alimentación con los otros tres.
 *
 * Dos de los tres puentes son literalmente el mismo acto: el trayecto a pie al mercado es a la vez
 * el abastecimiento de este pilar y el desplazamiento sin motor de Movimiento, y la cena sin
 * dispositivos es a la vez esta cena y la ventana de silencio de Mente.
 */
export default function NutritionPillarBridges(): React.ReactNode {
  const t = useTranslations("pillarPages.nutrition");

  const bridges: readonly PillarBridge[] = [
    {
      to: "sleep",
      title: t("bridgeSleepTitle"),
      body: t("bridgeSleepBody"),
    },
    {
      to: "movement",
      title: t("bridgeMovementTitle"),
      body: t("bridgeMovementBody"),
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
