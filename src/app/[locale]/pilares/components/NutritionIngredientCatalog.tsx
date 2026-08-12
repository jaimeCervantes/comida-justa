import { useTranslations } from "next-intl";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { PillarSectionHeading } from "./PillarArticle";
import { pillarColorClasses } from "./pilaresData";

/**
 * Las cuatro categorías con las que se arma la triada, cada una con lo que le hace al cuerpo y lo
 * que le hace al entorno.
 *
 * **Tarjetas y no una tabla.** La fuente de esto es una tabla de cuatro columnas, y trasladarla tal
 * cual habría dejado la página desbordada a lo ancho justo en el teléfono, que es donde se consulta
 * a la hora de comprar. Cada categoría se lee entera de arriba abajo y nada obliga a hacer scroll
 * horizontal.
 *
 * El impacto ecológico va en la misma tarjeta que el nutricional y no en una sección de
 * sostenibilidad aparte: es la misma decisión de compra, y separarla la volvería opcional.
 */
type CatalogCategory = {
  title: string;
  items: readonly string[];
  nutrition: string;
  local: string;
};

export default function NutritionIngredientCatalog(): React.ReactNode {
  const t = useTranslations("pillarPages.nutrition");
  const color = pillarColorClasses.nutrition;

  const categories: readonly CatalogCategory[] = [
    {
      title: t("catalogProteinsTitle"),
      items: [
        t("catalogProteinsItem1"),
        t("catalogProteinsItem2"),
        t("catalogProteinsItem3"),
        t("catalogProteinsItem4"),
      ],
      nutrition: t("catalogProteinsNutrition"),
      local: t("catalogProteinsLocal"),
    },
    {
      title: t("catalogCarbsTitle"),
      items: [
        t("catalogCarbsItem1"),
        t("catalogCarbsItem2"),
        t("catalogCarbsItem3"),
        t("catalogCarbsItem4"),
      ],
      nutrition: t("catalogCarbsNutrition"),
      local: t("catalogCarbsLocal"),
    },
    {
      title: t("catalogFatsTitle"),
      items: [
        t("catalogFatsItem1"),
        t("catalogFatsItem2"),
        t("catalogFatsItem3"),
        t("catalogFatsItem4"),
      ],
      nutrition: t("catalogFatsNutrition"),
      local: t("catalogFatsLocal"),
    },
    {
      title: t("catalogOilsTitle"),
      items: [
        t("catalogOilsItem1"),
        t("catalogOilsItem2"),
        t("catalogOilsItem3"),
        t("catalogOilsItem4"),
      ],
      nutrition: t("catalogOilsNutrition"),
      local: t("catalogOilsLocal"),
    },
  ];

  const nutritionLabel = t("catalogNutritionLabel");
  const localLabel = t("catalogLocalLabel");

  return (
    <section>
      <PillarSectionHeading>{t("catalogHeading")}</PillarSectionHeading>
      <p className="mb-6">{t("catalogIntro")}</p>

      <ul className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => (
          <li
            key={category.title}
            className={`rounded-2xl border p-6 ${color.bg} ${color.border}`}
          >
            <Heading level={3} size="sm">
              {category.title}
            </Heading>

            <ul className="mt-3 list-disc space-y-1 pl-5 text-base leading-relaxed">
              {category.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <dl className="mt-4 space-y-3 text-base leading-relaxed">
              <div>
                <dt className={`font-bold ${color.text}`}>{nutritionLabel}</dt>
                <dd className="mt-1">{category.nutrition}</dd>
              </div>
              <div>
                <dt className={`font-bold ${color.text}`}>{localLabel}</dt>
                <dd className="mt-1">{category.local}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
