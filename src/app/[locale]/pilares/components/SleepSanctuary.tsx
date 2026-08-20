import { useTranslations } from "next-intl";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { PillarSectionHeading } from "./PillarArticle";
import { pillarColorClasses } from "./pilaresData";

/**
 * El santuario del descanso: oscuro, fresco y sin teléfono.
 *
 * Las tres condiciones van juntas y con el mismo peso porque las tres son de entorno, no de fuerza
 * de voluntad. Ese es el punto de la sección: no se trata de querer dormir mejor, se trata de que
 * el cuarto deje de trabajar en contra. La del teléfono lo dice explícitamente para que no se lea
 * como un consejo de disciplina más.
 */
type SanctuaryCondition = {
  title: string;
  body: string;
};

export default function SleepSanctuary(): React.ReactNode {
  const t = useTranslations("pillarPages.sleep");
  const color = pillarColorClasses.sleep;

  const conditions: readonly SanctuaryCondition[] = [
    { title: t("sanctuaryDarkTitle"), body: t("sanctuaryDarkBody") },
    { title: t("sanctuaryCoolTitle"), body: t("sanctuaryCoolBody") },
    { title: t("sanctuaryPhoneTitle"), body: t("sanctuaryPhoneBody") },
  ];

  return (
    <section>
      <PillarSectionHeading>{t("sanctuaryHeading")}</PillarSectionHeading>
      <p className="mb-6">{t("sanctuaryIntro")}</p>

      <ul className="grid gap-3 sm:grid-cols-3">
        {conditions.map((condition) => (
          <li
            key={condition.title}
            className={`rounded-card border p-5 ${color.bg} ${color.border}`}
          >
            <Heading level={3} size="xs">
              {condition.title}
            </Heading>
            <p className="mt-2 text-base leading-relaxed">{condition.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
