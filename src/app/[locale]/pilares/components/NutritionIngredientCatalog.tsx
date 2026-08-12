import { useTranslations } from "next-intl";
import PillarCatalog, { type PillarCatalogCategory } from "./PillarCatalog";

/**
 * Las cuatro categorías con las que se arma la triada, leídas del catálogo de idiomas.
 *
 * Aquí solo viven los datos: la tarjeta la pinta `PillarCatalog`, que comparte con Movimiento.
 * Cada clave se escribe entera y a mano —una compuesta en tiempo de ejecución no aparece al
 * buscarla—, y por eso esto es una lista larga y no un bucle sobre índices.
 */
export default function NutritionIngredientCatalog(): React.ReactNode {
  const t = useTranslations("pillarPages.nutrition");

  const categories: readonly PillarCatalogCategory[] = [
    {
      title: t("catalogProteinsTitle"),
      items: [
        t("catalogProteinsItem1"),
        t("catalogProteinsItem2"),
        t("catalogProteinsItem3"),
        t("catalogProteinsItem4"),
      ],
      bodyImpact: t("catalogProteinsNutrition"),
      localImpact: t("catalogProteinsLocal"),
    },
    {
      title: t("catalogCarbsTitle"),
      items: [
        t("catalogCarbsItem1"),
        t("catalogCarbsItem2"),
        t("catalogCarbsItem3"),
        t("catalogCarbsItem4"),
      ],
      bodyImpact: t("catalogCarbsNutrition"),
      localImpact: t("catalogCarbsLocal"),
    },
    {
      title: t("catalogFatsTitle"),
      items: [
        t("catalogFatsItem1"),
        t("catalogFatsItem2"),
        t("catalogFatsItem3"),
        t("catalogFatsItem4"),
      ],
      bodyImpact: t("catalogFatsNutrition"),
      localImpact: t("catalogFatsLocal"),
    },
    {
      title: t("catalogOilsTitle"),
      items: [
        t("catalogOilsItem1"),
        t("catalogOilsItem2"),
        t("catalogOilsItem3"),
        t("catalogOilsItem4"),
      ],
      bodyImpact: t("catalogOilsNutrition"),
      localImpact: t("catalogOilsLocal"),
    },
  ];

  return (
    <PillarCatalog
      pillar="nutrition"
      heading={t("catalogHeading")}
      intro={t("catalogIntro")}
      bodyLabel={t("catalogNutritionLabel")}
      localLabel={t("catalogLocalLabel")}
      categories={categories}
    />
  );
}
