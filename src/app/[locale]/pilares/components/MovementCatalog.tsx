import { useTranslations } from "next-intl";
import PillarCatalog, { type PillarCatalogCategory } from "./PillarCatalog";

/**
 * Las cuatro formas de llenar la cadencia, leídas del catálogo de idiomas.
 *
 * Mismo reparto que en Alimentación: aquí los datos, la tarjeta en `PillarCatalog`. El gimnasio, el
 * estudio y la clase de la zona aparecen dentro de fuerza y de resistencia a propósito —son
 * negocios del barrio como el mercado— y no como la alternativa a evitar.
 */
export default function MovementCatalog(): React.ReactNode {
  const t = useTranslations("pillarPages.movement");

  const categories: readonly PillarCatalogCategory[] = [
    {
      title: t("catalogProximityTitle"),
      items: [
        t("catalogProximityItem1"),
        t("catalogProximityItem2"),
        t("catalogProximityItem3"),
        t("catalogProximityItem4"),
      ],
      bodyImpact: t("catalogProximityBody"),
      localImpact: t("catalogProximityLocal"),
    },
    {
      title: t("catalogTerrainTitle"),
      items: [
        t("catalogTerrainItem1"),
        t("catalogTerrainItem2"),
        t("catalogTerrainItem3"),
        t("catalogTerrainItem4"),
      ],
      bodyImpact: t("catalogTerrainBody"),
      localImpact: t("catalogTerrainLocal"),
    },
    {
      title: t("catalogStrengthTitle"),
      items: [
        t("catalogStrengthItem1"),
        t("catalogStrengthItem2"),
        t("catalogStrengthItem3"),
        t("catalogStrengthItem4"),
      ],
      bodyImpact: t("catalogStrengthBody"),
      localImpact: t("catalogStrengthLocal"),
    },
    {
      title: t("catalogEnduranceTitle"),
      items: [
        t("catalogEnduranceItem1"),
        t("catalogEnduranceItem2"),
        t("catalogEnduranceItem3"),
        t("catalogEnduranceItem4"),
      ],
      bodyImpact: t("catalogEnduranceBody"),
      localImpact: t("catalogEnduranceLocal"),
    },
  ];

  return (
    <PillarCatalog
      pillar="movement"
      heading={t("catalogHeading")}
      intro={t("catalogIntro")}
      bodyLabel={t("catalogBodyLabel")}
      localLabel={t("catalogLocalLabel")}
      categories={categories}
    />
  );
}
