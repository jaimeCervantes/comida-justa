import { useTranslations } from "next-intl";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { PillarSectionHeading } from "./PillarArticle";
import { pillarColorClasses } from "./pilaresData";

/**
 * La cadencia del día: qué toca cada 50 minutos, cada día y cada semana.
 *
 * Es lo que la triada del plato es en Alimentación: responde «cuánto» sin prescribir volumen. La
 * frecuencia manda —va grande y arriba— porque lo que decide el resultado es cada cuánto vuelves,
 * no cuánto haces de una vez, y porque un número de series o de kilómetros invita justo a la
 * comparación que los cuatro pilares evitan.
 *
 * La nota del final separa dos cosas que se confunden todo el tiempo: hacer más **te conviene**, y
 * hacer más **no da más puntos**. Sin decirlo, «los puntos no miden volumen» se lee como «no te
 * molestes en hacer más», que es lo contrario de lo que este pilar quiere.
 */
type CadenceTier = {
  frequency: string;
  title: string;
  body: string;
};

export default function MovementDailyCadence(): React.ReactNode {
  const t = useTranslations("pillarPages.movement");
  const color = pillarColorClasses.movement;

  const tiers: readonly CadenceTier[] = [
    {
      frequency: t("cadence50Label"),
      title: t("cadence50Title"),
      body: t("cadence50Body"),
    },
    {
      frequency: t("cadenceDayLabel"),
      title: t("cadenceDayTitle"),
      body: t("cadenceDayBody"),
    },
    {
      frequency: t("cadenceWeekLabel"),
      title: t("cadenceWeekTitle"),
      body: t("cadenceWeekBody"),
    },
  ];

  return (
    <section>
      <PillarSectionHeading>{t("cadenceHeading")}</PillarSectionHeading>
      <p className="mb-6">{t("cadenceIntro")}</p>

      <ol className="grid gap-3 sm:grid-cols-3">
        {tiers.map((tier) => (
          <li
            key={tier.frequency}
            className={`rounded-2xl border p-5 ${color.bg} ${color.border}`}
          >
            <span
              className={`block text-sm font-black uppercase tracking-[0.15em] ${color.text}`}
            >
              {tier.frequency}
            </span>
            <Heading level={3} size="xs" className="mt-2">
              {tier.title}
            </Heading>
            <p className="mt-2 text-base leading-relaxed">{tier.body}</p>
          </li>
        ))}
      </ol>

      <p
        className={`mt-3 rounded-2xl border border-dashed p-5 text-base leading-relaxed ${color.border}`}
      >
        {t("cadenceMoreNote")}
      </p>
    </section>
  );
}
