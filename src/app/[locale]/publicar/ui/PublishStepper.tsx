"use client";

import { useTranslations } from "next-intl";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import { PUBLISH_STEPS } from "../publishSteps";

/**
 * En qué paso del asistente va quien publica, y cuántos quedan.
 *
 * Los puntos son **botones**, no adornos: se puede volver a un paso ya visto y saltar hacia
 * delante. El asistente no encierra —quien sabe lo que va a escribir no tiene por qué pasar por
 * tres pantallas en orden— y lo que impide publicar a medias no es el orden, es la validación al
 * enviar, que además lleva de vuelta al paso donde está el error.
 *
 * `aria-current="step"` es lo que hace que un lector de pantalla anuncie dónde está sin depender
 * del color, y el rótulo de texto —«paso 2 de 3 · cómo se ve»— dice lo mismo sin mirar los puntos.
 */
export default function PublishStepper({
  current,
  onGoTo,
}: {
  /** Índice del paso visible. */
  current: number;
  onGoTo: (index: number) => void;
}): React.ReactNode {
  const t = useTranslations("publish");
  const step = PUBLISH_STEPS[current];

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-caption font-semibold uppercase tracking-[0.14em] text-text-muted">
          {t("stepCounter", {
            current: current + 1,
            total: PUBLISH_STEPS.length,
            name: t(step.labelKey),
          })}
        </span>

        <nav aria-label={t("stepsLabel")} className="flex items-center gap-2">
          {PUBLISH_STEPS.map((candidate, index) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => onGoTo(index)}
              aria-current={index === current ? "step" : undefined}
              data-testid={`publish-step-${candidate.id}`}
              className={cn(
                "focus-ring h-2 w-8 rounded-full transition-colors",
                /* El que está y los ya vistos, rellenos; los que faltan, en hueco. Un punto por
                   paso y no una barra de porcentaje: son tres, y contar tres es más rápido que
                   interpretar un 66%. */
                index <= current
                  ? "bg-button-primary-bg"
                  : "bg-surface-elevation-2",
              )}
            >
              <span className="sr-only">{t(candidate.labelKey)}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Cuánto cuesta, en tiempo. Es la pregunta que decide si alguien empieza ahora o «luego». */}
      <span className="text-label text-text-support">{t("stepDuration")}</span>
    </div>
  );
}
