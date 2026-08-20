import { useTranslations } from "next-intl";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { PillarSectionHeading } from "./PillarArticle";
import { pillarColorClasses } from "./pilaresData";

/**
 * El arraigo al aire libre y la respiración 4-7-8.
 *
 * Van juntos porque el silencio a solas no basta: una cabeza que se queda quieta empieza a rumiar,
 * y salir y respirar le dan algo concreto que hacer mientras se calma.
 *
 * Los tres tiempos de la respiración son una lista ordenada y no un párrafo: se siguen mientras se
 * hacen, y una instrucción que hay que releer a media inhalación no sirve.
 *
 * La nota del final dice **respirar despacio**, no «exhalar más largo». Es deliberado: el ensayo de
 * 2024 que probó justo eso —y su réplica— no encontró diferencia de HRV entre 1:1 y 1:2. Lo que
 * sostiene la evidencia es bajar las respiraciones por minuto, así que la nota manda a aflojar el
 * ritmo y no a perseguir la proporción exacta, que además es la excusa habitual para abandonar
 * creyendo que se hace mal.
 */
export default function MindGroundingAndBreath(): React.ReactNode {
  const t = useTranslations("pillarPages.mindSpirit");
  const color = pillarColorClasses.mindSpirit;

  const breathSteps: readonly string[] = [
    t("groundingBreathIn"),
    t("groundingBreathHold"),
    t("groundingBreathOut"),
  ];

  return (
    <section>
      <PillarSectionHeading>{t("groundingHeading")}</PillarSectionHeading>
      <p className="mb-6">{t("groundingIntro")}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`rounded-card border p-6 ${color.bg} ${color.border}`}>
          <Heading level={3} size="xs">
            {t("groundingOutdoorTitle")}
          </Heading>
          <p className="mt-3 text-base leading-relaxed">
            {t("groundingOutdoorBody")}
          </p>
        </div>

        <div className={`rounded-card border p-6 ${color.bg} ${color.border}`}>
          <Heading level={3} size="xs">
            {t("groundingBreathTitle")}
          </Heading>
          <p className="mt-3 text-base leading-relaxed">
            {t("groundingBreathIntro")}
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-relaxed">
            {breathSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      <p
        className={`mt-3 rounded-card border border-dashed p-5 text-base leading-relaxed ${color.border}`}
      >
        {t("groundingBreathNote")}
      </p>
    </section>
  );
}
