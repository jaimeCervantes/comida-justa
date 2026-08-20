import { useTranslations } from "next-intl";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { PillarSectionHeading } from "./PillarArticle";
import { pillarColorClasses } from "./pilaresData";

/**
 * Las tres ventanas del día en las que el teléfono no está: primera hora, la mesa y última hora.
 *
 * Es lo que la cadencia es en Movimiento y la triada en Alimentación: responde «cuándo» sin pedir
 * que nadie cuente nada. No hay minutos que sumar a propósito —«dos horas sin pantalla» convierte
 * la calma en una métrica más, que es justo el problema del que viene quien lee esto—.
 */
type SilenceWindow = {
  moment: string;
  title: string;
  body: string;
};

export default function MindSilenceWindows(): React.ReactNode {
  const t = useTranslations("pillarPages.mindSpirit");
  const color = pillarColorClasses.mindSpirit;

  const windows: readonly SilenceWindow[] = [
    {
      moment: t("windowMorningLabel"),
      title: t("windowMorningTitle"),
      body: t("windowMorningBody"),
    },
    {
      moment: t("windowTableLabel"),
      title: t("windowTableTitle"),
      body: t("windowTableBody"),
    },
    {
      moment: t("windowNightLabel"),
      title: t("windowNightTitle"),
      body: t("windowNightBody"),
    },
  ];

  return (
    <section>
      <PillarSectionHeading>{t("windowsHeading")}</PillarSectionHeading>
      <p className="mb-6">{t("windowsIntro")}</p>

      <ol className="grid gap-3 sm:grid-cols-3">
        {windows.map((window) => (
          <li
            key={window.moment}
            className={`rounded-card border p-5 ${color.bg} ${color.border}`}
          >
            <span
              className={`block text-sm font-black uppercase tracking-[0.15em] ${color.text}`}
            >
              {window.moment}
            </span>
            <Heading level={3} size="xs" className="mt-2">
              {window.title}
            </Heading>
            <p className="mt-2 text-base leading-relaxed">{window.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
