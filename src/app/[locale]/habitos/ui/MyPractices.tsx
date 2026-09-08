import { useTranslations } from "next-intl";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import type { PracticeCard } from "~/domain/practices/practiceCard";
import { primaryPillarOf } from "~/domain/practices/practiceCard";
import { Link } from "~/i18n/navigation";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { pillarColorClasses } from "~/presentation/habits/pillarColors";
import PracticeEvidenceForm, {
  type PracticeEvidenceActionState,
} from "./PracticeEvidenceForm";

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
  doneTodayPillars = new Set(),
  markAction,
  sharedPracticeKeys = new Set(),
  sharingAction,
  evidenceAction,
}: {
  practices: readonly PracticeCard[];
  doneTodayPillars?: ReadonlySet<PillarKey>;
  markAction?: (formData: FormData) => Promise<void>;
  sharedPracticeKeys?: ReadonlySet<string>;
  sharingAction?: (formData: FormData) => Promise<void>;
  evidenceAction?: (
    state: PracticeEvidenceActionState,
    data: FormData,
  ) => Promise<PracticeEvidenceActionState>;
}): React.ReactNode {
  const t = useTranslations("practicesIndex");
  const tPillars = useTranslations("pillars");

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
              const pillar = primaryPillarOf(practice);
              const color = pillarColorClasses[pillar];
              const doneToday = doneTodayPillars.has(pillar);
              const shared = sharedPracticeKeys.has(practice.key);
              return (
                <li
                  key={practice.key}
                  data-practice={practice.key}
                  className={`rounded-control border p-4 ${color.border} ${color.bg}`}
                >
                  <p className="font-semibold text-text-strong">
                    {practice.title}
                  </p>
                  <p
                    className={`mt-1 text-caption font-semibold ${color.text}`}
                  >
                    {tPillars(`${pillar}.short`)}
                  </p>
                  {practice.cue && (
                    <p
                      className={`mt-1 text-caption font-semibold ${color.text}`}
                    >
                      {t("cueLabel")}: {practice.cue}
                    </p>
                  )}
                  {practice.minimum && (
                    <p className="mt-2 text-caption text-body">
                      <span className="font-semibold">{t("minimumLabel")}</span>{" "}
                      {practice.minimum}
                    </p>
                  )}

                  {doneToday ? (
                    <p
                      data-testid="practice-done-today"
                      className="mt-3 text-caption text-text-muted"
                    >
                      {t("countedToday")}
                    </p>
                  ) : markAction ? (
                    <form action={markAction} className="mt-3">
                      <input
                        type="hidden"
                        name="practiceKey"
                        value={practice.key}
                      />
                      <button
                        type="submit"
                        data-testid="practice-mark"
                        className="focus-ring rounded-control border border-separator px-3 py-1.5 text-caption font-semibold text-text-support"
                      >
                        {t("markDone")}
                      </button>
                    </form>
                  ) : null}

                  {sharingAction && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-control border border-separator bg-surface/70 px-3 py-2">
                      <div>
                        <p className="text-caption font-semibold text-text-strong">
                          {t("sharingTitle")}
                        </p>
                        <p
                          data-testid="practice-sharing-status"
                          className="text-caption text-text-muted"
                        >
                          {shared ? t("sharingShared") : t("sharingPrivate")}
                        </p>
                      </div>
                      <form action={sharingAction}>
                        <input
                          type="hidden"
                          name="practiceKey"
                          value={practice.key}
                        />
                        <input
                          type="hidden"
                          name="intent"
                          value={shared ? "withdraw" : "share"}
                        />
                        <button
                          type="submit"
                          role="switch"
                          aria-checked={shared}
                          data-testid="practice-sharing-toggle"
                          className={`focus-ring flex h-7 w-12 shrink-0 items-center rounded-full border p-1 transition ${
                            shared
                              ? "justify-end border-pw-green bg-pw-green"
                              : "justify-start border-separator bg-surface-elevation-1"
                          }`}
                        >
                          <span className="sr-only">
                            {shared ? t("sharingDisable") : t("sharingEnable")}
                          </span>
                          <span className="block size-4 rounded-full bg-white shadow-sm" />
                        </button>
                      </form>
                    </div>
                  )}

                  {evidenceAction ? (
                    <PracticeEvidenceForm
                      practice={practice}
                      pillarLabel={tPillars(`${pillar}.short`)}
                      action={evidenceAction}
                    />
                  ) : null}
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
