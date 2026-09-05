import { useTranslations } from "next-intl";
import type { PracticeCard } from "~/domain/practices/practiceCard";
import { primaryPillarOf } from "~/domain/practices/practiceCard";
import { Link } from "~/i18n/navigation";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { pillarColorClasses } from "~/presentation/habits/pillarColors";

/**
 * Lo que esta persona lleva del catálogo, en la pantalla donde ya busca «lo mío».
 *
 * Enseña el **ancla** y no la promesa: quien vuelve aquí no necesita que le convenzan otra vez de
 * que atenuar la casa ayuda, necesita acordarse de cuándo lo hace. La promesa vive en `/practicas`,
 * que es donde se elige.
 *
 * Sin prácticas no se esconde: invita al catálogo. Una sección que desaparece deja a quien todavía
 * no ha empezado sin saber que existe.
 */
export default function MyPractices({
  practices,
}: {
  practices: readonly PracticeCard[];
}): React.ReactNode {
  const t = useTranslations("practicesIndex");

  return (
    <section
      data-testid="my-practices"
      className="mt-8 rounded-panel border border-separator bg-surface-elevation-1 p-6 sm:p-8"
    >
      <Heading level={2} tone="inherit" className="text-text-strong">
        {t("mineTitle")}
      </Heading>

      {practices.length === 0 ? (
        <p className="mt-2 text-body">
          {t("mineEmpty")}{" "}
          <Link href="/practicas" className="font-semibold underline">
            {t("mineBrowse")}
          </Link>
        </p>
      ) : (
        <>
          <ul className="mt-5 space-y-3">
            {practices.map((practice) => {
              const color = pillarColorClasses[primaryPillarOf(practice)];
              return (
                <li
                  key={practice.key}
                  data-practice={practice.key}
                  className={`rounded-control border p-4 ${color.border} ${color.bg}`}
                >
                  <p className="font-semibold text-text-strong">
                    {practice.title}
                  </p>
                  {practice.cue && (
                    <p
                      className={`mt-1 text-caption font-semibold ${color.text}`}
                    >
                      {t("cueLabel")}: {practice.cue}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-caption">
            <Link href="/practicas" className="font-semibold underline">
              {t("mineBrowse")}
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
