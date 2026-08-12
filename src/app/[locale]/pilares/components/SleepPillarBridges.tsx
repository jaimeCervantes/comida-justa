import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { pillarHref } from "~/i18n/routes";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { PillarSectionHeading } from "./PillarArticle";
import { type PillarKey, pillarColorClasses } from "./pilaresData";

/**
 * Cómo llegan a Sueño los otros tres pilares.
 *
 * Vive aquí y no en las cuatro páginas porque los tres puentes van en la misma dirección: la cena
 * temprana, el movimiento diurno y el cierre digital se **cobran** en el descanso. Sueño es el que
 * recibe, así que es donde tiene sentido leerlos juntos.
 *
 * Cada tarjeta se pinta con el color de **su** pilar, no con el de Sueño: el color es lo que hace
 * que se lea como un puente y no como tres párrafos más de esta página. El enlace usa `pillarHref`
 * y el `Link` de `~/i18n/navigation`, que conservan el idioma activo; una cadena escrita a mano
 * mandaría a un lector en inglés a la versión en español.
 */
type PillarBridge = {
  pillar: Exclude<PillarKey, "sleep">;
  slug: "alimentacion" | "movimiento" | "mente-espiritu";
  title: string;
  body: string;
};

export default function SleepPillarBridges(): React.ReactNode {
  const t = useTranslations("pillarPages.sleep");
  const linkLabel = t("bridgeLink");

  const bridges: readonly PillarBridge[] = [
    {
      pillar: "nutrition",
      slug: "alimentacion",
      title: t("bridgeNutritionTitle"),
      body: t("bridgeNutritionBody"),
    },
    {
      pillar: "movement",
      slug: "movimiento",
      title: t("bridgeMovementTitle"),
      body: t("bridgeMovementBody"),
    },
    {
      pillar: "mindSpirit",
      slug: "mente-espiritu",
      title: t("bridgeMindTitle"),
      body: t("bridgeMindBody"),
    },
  ];

  return (
    <section>
      <PillarSectionHeading>{t("bridgeHeading")}</PillarSectionHeading>
      <p className="mb-6">{t("bridgeIntro")}</p>

      <ul className="grid gap-4 lg:grid-cols-3">
        {bridges.map((bridge) => {
          const color = pillarColorClasses[bridge.pillar];

          return (
            <li
              key={bridge.slug}
              className={`rounded-2xl border p-6 ${color.bg} ${color.border}`}
            >
              <Heading level={3} size="xs">
                {bridge.title}
              </Heading>
              <p className="mt-2 text-base leading-relaxed">{bridge.body}</p>
              <Link
                href={pillarHref(bridge.slug)}
                className={`focus-ring mt-4 inline-flex rounded-lg font-semibold underline ${color.link}`}
              >
                {linkLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
