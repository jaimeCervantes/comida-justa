import { useTranslations } from "next-intl";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { PillarSectionHeading } from "./PillarArticle";
import { pillarColorClasses } from "./pilaresData";

/**
 * El pie y el terreno: qué buscar en un calzado funcional y qué buscar bajo los pies.
 *
 * Los tres criterios del calzado —horma, suela, drop— son verificables en la tienda, y por eso van
 * como lista y no dentro de un párrafo: «usa calzado cómodo» no le sirve a nadie frente al
 * estante.
 *
 * La nota de transición no es un adorno legal. Un pie acostumbrado a suela rígida y talón alto se
 * lesiona con facilidad si cambia de golpe, y esta sección es justo la que invita a cambiar; decir
 * «hazlo poco a poco» es parte del consejo, no una advertencia añadida después.
 */
export default function MovementFootAndTerrain(): React.ReactNode {
  const t = useTranslations("pillarPages.movement");
  const color = pillarColorClasses.movement;

  const shoeCriteria: readonly string[] = [
    t("footShoeWide"),
    t("footShoeFlex"),
    t("footShoeDrop"),
  ];

  return (
    <section>
      <PillarSectionHeading>{t("footHeading")}</PillarSectionHeading>
      <p className="mb-6">{t("footIntro")}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`rounded-2xl border p-6 ${color.bg} ${color.border}`}>
          <Heading level={3} size="xs">
            {t("footShoeTitle")}
          </Heading>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed">
            {shoeCriteria.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>
        </div>

        <div className={`rounded-2xl border p-6 ${color.bg} ${color.border}`}>
          <Heading level={3} size="xs">
            {t("footTerrainTitle")}
          </Heading>
          <p className="mt-3 text-base leading-relaxed">
            {t("footTerrainBody")}
          </p>
        </div>
      </div>

      <p
        className={`mt-3 rounded-2xl border border-dashed p-5 text-base leading-relaxed ${color.border}`}
      >
        {t("footTransitionNote")}
      </p>
    </section>
  );
}
