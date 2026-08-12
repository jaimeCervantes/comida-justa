import { useTranslations } from "next-intl";
import PillarCatalog, { type PillarCatalogCategory } from "./PillarCatalog";

/**
 * Las cuatro prácticas de presencia, leídas del catálogo de idiomas.
 *
 * Mismo reparto que en Alimentación y Movimiento: aquí los datos, la tarjeta en `PillarCatalog`.
 * Con este pilar son ya tres los que comparten la forma, que es exactamente por lo que se extrajo.
 */
export default function MindPracticeCatalog(): React.ReactNode {
  const t = useTranslations("pillarPages.mindSpirit");

  const categories: readonly PillarCatalogCategory[] = [
    {
      title: t("catalogDigitalTitle"),
      items: [
        t("catalogDigitalItem1"),
        t("catalogDigitalItem2"),
        t("catalogDigitalItem3"),
        t("catalogDigitalItem4"),
      ],
      bodyImpact: t("catalogDigitalBody"),
      localImpact: t("catalogDigitalLocal"),
    },
    {
      title: t("catalogNatureTitle"),
      items: [
        t("catalogNatureItem1"),
        t("catalogNatureItem2"),
        t("catalogNatureItem3"),
        t("catalogNatureItem4"),
      ],
      bodyImpact: t("catalogNatureBody"),
      localImpact: t("catalogNatureLocal"),
    },
    {
      title: t("catalogDialogueTitle"),
      items: [
        t("catalogDialogueItem1"),
        t("catalogDialogueItem2"),
        t("catalogDialogueItem3"),
        t("catalogDialogueItem4"),
      ],
      bodyImpact: t("catalogDialogueBody"),
      localImpact: t("catalogDialogueLocal"),
    },
    {
      title: t("catalogServiceTitle"),
      items: [
        t("catalogServiceItem1"),
        t("catalogServiceItem2"),
        t("catalogServiceItem3"),
        t("catalogServiceItem4"),
      ],
      bodyImpact: t("catalogServiceBody"),
      localImpact: t("catalogServiceLocal"),
    },
  ];

  return (
    <PillarCatalog
      pillar="mindSpirit"
      heading={t("catalogHeading")}
      intro={t("catalogIntro")}
      bodyLabel={t("catalogBodyLabel")}
      localLabel={t("catalogLocalLabel")}
      categories={categories}
    />
  );
}
