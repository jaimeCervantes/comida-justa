import { useTranslations } from "next-intl";
import PillarCatalog, { type PillarCatalogCategory } from "./PillarCatalog";

/**
 * Las tres familias de prácticas de descanso, leídas del catálogo de idiomas.
 *
 * Son tres y no cuatro como en los otros pilares: la fuente tiene tres, y rellenar una cuarta solo
 * para que las cuatro páginas se vean simétricas habría sido inventar contenido. `PillarCatalog`
 * reparte por número de categorías, así que no hace falta tocarlo.
 */
export default function SleepPracticeCatalog(): React.ReactNode {
  const t = useTranslations("pillarPages.sleep");

  const categories: readonly PillarCatalogCategory[] = [
    {
      title: t("catalogLightTitle"),
      items: [
        t("catalogLightItem1"),
        t("catalogLightItem2"),
        t("catalogLightItem3"),
        t("catalogLightItem4"),
      ],
      bodyImpact: t("catalogLightBody"),
      localImpact: t("catalogLightLocal"),
    },
    {
      title: t("catalogEnvironmentTitle"),
      items: [
        t("catalogEnvironmentItem1"),
        t("catalogEnvironmentItem2"),
        t("catalogEnvironmentItem3"),
        t("catalogEnvironmentItem4"),
      ],
      bodyImpact: t("catalogEnvironmentBody"),
      localImpact: t("catalogEnvironmentLocal"),
    },
    {
      title: t("catalogUnloadTitle"),
      items: [
        t("catalogUnloadItem1"),
        t("catalogUnloadItem2"),
        t("catalogUnloadItem3"),
        t("catalogUnloadItem4"),
      ],
      bodyImpact: t("catalogUnloadBody"),
      localImpact: t("catalogUnloadLocal"),
    },
  ];

  return (
    <PillarCatalog
      pillar="sleep"
      heading={t("catalogHeading")}
      intro={t("catalogIntro")}
      bodyLabel={t("catalogBodyLabel")}
      localLabel={t("catalogLocalLabel")}
      categories={categories}
    />
  );
}
