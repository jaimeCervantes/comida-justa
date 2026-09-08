import { getTranslations } from "next-intl/server";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import { PostgresPracticeCatalog } from "~/infra/dataAccess/practices/PostgresPracticeCatalog";
import PracticeCatalogUseCase from "~/use_cases/practices/practiceCatalogUseCase";
import PillarCatalog from "./PillarCatalog";

/**
 * El catálogo de un pilar, leído de la base.
 *
 * Sustituye a los cuatro componentes que armaban las mismas categorías desde el catálogo de idiomas
 * —`SleepPracticeCatalog`, `NutritionIngredientCatalog`, `MovementCatalog`, `MindPracticeCatalog`—
 * y con ellos a las ciento cinco claves de i18n que los alimentaban. La forma no cambia: cambia de
 * dónde salen los datos.
 *
 * **Los ítems son ahora los nombres de las prácticas.** Antes eran frases sueltas que repetían, con
 * otras palabras, lo que la práctica ya dice; desde que el catálogo es dato esa repetición sería una
 * segunda redacción del mismo contenido, y ya se vio a dónde lleva eso —la respiración se
 * contradecía consigo misma en dos páginas—. El detalle de cada práctica, con su ancla y su
 * evidencia, vive en `/practicas`.
 *
 * El encabezado, la entradilla y las dos etiquetas siguen en i18n: son el marco de la sección, no su
 * contenido, y una tabla para cuatro filas de texto de página no compraba nada.
 */
export default async function PillarCatalogSection({
  pillar,
  locale,
  heading,
  intro,
  bodyLabel,
  localLabel,
}: {
  pillar: PillarKey;
  locale: string;
  heading: string;
  intro: string;
  bodyLabel: string;
  localLabel: string;
}): Promise<React.ReactNode> {
  const themes = await new PracticeCatalogUseCase(
    new PostgresPracticeCatalog(),
  ).listThemes(pillar, locale);

  if (themes.length === 0) return null;

  const t = await getTranslations("practicesIndex");

  return (
    <PillarCatalog
      pillar={pillar}
      heading={heading}
      intro={intro}
      bodyLabel={bodyLabel}
      localLabel={localLabel}
      browseLabel={t("mineBrowse")}
      categories={themes.map((theme) => ({
        title: theme.title,
        items: theme.practices,
        bodyImpact: theme.bodyImpact,
        localImpact: theme.localImpact,
      }))}
    />
  );
}
