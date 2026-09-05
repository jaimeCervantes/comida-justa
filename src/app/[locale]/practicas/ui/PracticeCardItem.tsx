import { useTranslations } from "next-intl";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import { alsoServes, type PracticeCard } from "~/domain/practices/practiceCard";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { pillarColorClasses } from "~/presentation/habits/pillarColors";

/**
 * Una práctica del catálogo.
 *
 * **El ancla va arriba del todo, antes del título.** Es deliberado: la primera ley de este producto
 * es hacerlo obvio, y lo que vuelve obvia una práctica es el momento, no el nombre. «Penumbra total»
 * es un buen consejo; «al apagar la luz, mirando qué sigue encendido» es algo que se puede hacer
 * esta noche. Quien recorre la lista buscando qué empezar lee cuándo antes que qué.
 *
 * No lee la base: recibe la práctica resuelta, así que se puede probar sin conexión.
 */
export default function PracticeCardItem({
  practice,
  pillar,
  adopted,
  signedIn,
  signInHref,
  action,
}: {
  practice: PracticeCard;
  pillar: PillarKey;
  /** Si quien mira la lleva activa. Siempre `false` sin sesión. */
  adopted: boolean;
  signedIn: boolean;
  signInHref: string;
  action: (formData: FormData) => Promise<void>;
}): React.ReactNode {
  const t = useTranslations("practicesIndex");
  const tPillars = useTranslations("pillars");
  const color = pillarColorClasses[pillar];
  const bridges = alsoServes(practice);

  return (
    <li
      data-testid="practice-card"
      data-practice={practice.key}
      className={`rounded-card border p-6 ${color.bg} ${color.border}`}
    >
      {practice.cue && (
        <p className="mb-2 flex flex-col gap-0.5">
          <span className="text-caption font-semibold uppercase tracking-[0.14em] text-text-muted">
            {t("cueLabel")}
          </span>
          <span className={`text-label font-semibold ${color.text}`}>
            {practice.cue}
          </span>
        </p>
      )}

      <Heading level={3} size="sm">
        {practice.title}
      </Heading>

      <p className="mt-2 text-base leading-relaxed">{practice.summary}</p>

      {practice.minimum && (
        <p className="mt-3 text-base leading-relaxed">
          <span className={`font-bold ${color.text}`}>{t("minimumLabel")}</span>{" "}
          {practice.minimum}
        </p>
      )}

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-muted">
        {practice.effortMinutes !== null && (
          <li>{t("effort", { minutes: practice.effortMinutes })}</li>
        )}
        {practice.costLevel === 0 && <li>{t("free")}</li>}
        {/*
          Cero estudios se enseña igual que cinco. Una práctica sin evidencia en esta bibliografía
          es una decisión sensata que nadie midió, y esconder el cero dejaría creer que todas están
          respaldadas por igual — que es justo la autoridad prestada que este catálogo deshizo.
        */}
        <li data-testid="practice-evidence">
          {t("studies", { count: practice.studyCount })}
        </li>
        {practice.challengeKey && (
          <li className={`font-semibold ${color.text}`}>{t("isRitual")}</li>
        )}
      </ul>

      {bridges.length > 0 && (
        <p className="mt-3 text-caption text-text-muted">
          {t("alsoServes")}{" "}
          {bridges.map((key) => tPillars(`${key}.short`)).join(" · ")}
        </p>
      )}

      {/*
        Empezar y dejar viven en el mismo sitio y con el mismo peso visual. Dejar una práctica no es
        un fracaso que haya que esconder detrás de un menú: es información, y este producto ya
        decidió que volver después de dejarla vale más que fingir perfección. Un botón difícil de
        encontrar sólo consigue que la gente deje de practicar sin decirlo.
      */}
      <div className="mt-5">
        {signedIn ? (
          <form action={action}>
            <input type="hidden" name="practiceKey" value={practice.key} />
            <input
              type="hidden"
              name="intent"
              value={adopted ? "stop" : "start"}
            />
            <button
              type="submit"
              data-testid="practice-toggle"
              className={
                adopted
                  ? "focus-ring rounded-control border border-separator px-4 py-2 text-caption font-semibold text-text-support"
                  : `focus-ring rounded-control px-4 py-2 font-semibold text-white ${color.badge}`
              }
            >
              {adopted ? t("stop") : t("start")}
            </button>
          </form>
        ) : (
          <a
            href={signInHref}
            className={`focus-ring rounded-control px-4 py-2 font-semibold text-white ${color.badge}`}
          >
            {t("startSignedOut")}
          </a>
        )}

        {adopted && (
          <p
            data-testid="practice-adopted"
            className={`mt-2 text-caption font-semibold ${color.text}`}
          >
            {t("practising")}
          </p>
        )}
      </div>
    </li>
  );
}
