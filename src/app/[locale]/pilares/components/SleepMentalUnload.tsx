import { useTranslations } from "next-intl";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { PillarSectionHeading } from "./PillarArticle";
import { pillarColorClasses } from "./pilaresData";

/**
 * La descarga mental: sacar lo pendiente a un papel antes de acostarse.
 *
 * El efecto que la sostiene —que una tarea abierta se recuerda mejor que una terminada— se explica
 * sin nombrarlo, igual que el resto del sitio evita nombrar marcos: lo que le sirve a quien lee es
 * saber que la cabeza no se apaga sola, no aprenderse el nombre del fenómeno.
 */
export default function SleepMentalUnload(): React.ReactNode {
  const t = useTranslations("pillarPages.sleep");
  const color = pillarColorClasses.sleep;

  return (
    <section>
      <PillarSectionHeading>{t("unloadHeading")}</PillarSectionHeading>
      <p className="mb-6">{t("unloadIntro")}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`rounded-2xl border p-6 ${color.bg} ${color.border}`}>
          <Heading level={3} size="xs">
            {t("unloadHowTitle")}
          </Heading>
          <p className="mt-3 text-base leading-relaxed">{t("unloadHowBody")}</p>
        </div>

        <div className={`rounded-2xl border p-6 ${color.bg} ${color.border}`}>
          <Heading level={3} size="xs">
            {t("unloadCalmTitle")}
          </Heading>
          <p className="mt-3 text-base leading-relaxed">
            {t("unloadCalmBody")}
          </p>
        </div>
      </div>
    </section>
  );
}
