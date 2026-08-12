import { useTranslations } from "next-intl";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { PillarSectionHeading } from "./PillarArticle";
import { pillarColorClasses } from "./pilaresData";

/**
 * Con qué se cocina la cena: qué sale, qué entra en su lugar y qué no necesita grasa.
 *
 * Cada aceite lleva su uso y su punto de humo, no solo su nombre. «Usa aceite de oliva» es un
 * consejo que se rompe en la primera sartén caliente: lo que decide si un aceite ayuda o daña es a
 * qué temperatura se le pone, y esa es la mitad que casi siempre falta.
 */
type CleanOil = { name: string; use: string };

export default function NutritionCleanCooking(): React.ReactNode {
  const t = useTranslations("pillarPages.nutrition");
  const color = pillarColorClasses.nutrition;

  const oils: readonly CleanOil[] = [
    { name: t("oilAvocadoName"), use: t("oilAvocadoUse") },
    { name: t("oilOliveName"), use: t("oilOliveUse") },
  ];

  return (
    <section>
      <PillarSectionHeading>{t("cookingHeading")}</PillarSectionHeading>
      <p className="mb-6">{t("cookingIntro")}</p>

      <Heading level={3} size="xs">
        {t("cookingOilsHeading")}
      </Heading>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {oils.map((oil) => (
          <li
            key={oil.name}
            className={`rounded-2xl border p-5 ${color.bg} ${color.border}`}
          >
            <p className={`font-bold ${color.text}`}>{oil.name}</p>
            <p className="mt-2 text-base leading-relaxed">{oil.use}</p>
          </li>
        ))}
      </ul>

      <div
        className={`mt-3 rounded-2xl border border-dashed p-5 ${color.border}`}
      >
        <Heading level={3} size="xs">
          {t("cookingZeroHeading")}
        </Heading>
        <p className="mt-2 text-base leading-relaxed">{t("cookingZeroBody")}</p>
      </div>
    </section>
  );
}
