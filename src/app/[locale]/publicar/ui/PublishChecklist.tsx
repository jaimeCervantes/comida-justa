"use client";

import { useTranslations } from "next-intl";
import { MdCheck } from "react-icons/md";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import {
  type PublishDraft,
  publishBlockingCount,
  publishChecklist,
} from "../publishChecklist";

/**
 * «Falta poco»: qué queda por escribir, y el atajo para ir a escribirlo.
 *
 * Es la otra mitad de la columna del 5.3. El asistente dice **dónde estás**; esto dice **qué
 * falta** — y con tres pasos hace más falta que antes, porque lo que no está en pantalla deja de
 * existir para quien mira.
 *
 * Cada punto es un **botón**, no un renglón. Enterarse de que falta el teléfono y tener que buscarlo
 * a mano por tres pasos es la mitad de la ayuda: pulsar lleva al paso que lo contiene y lo enfoca.
 *
 * Qué cuenta como hecho lo decide `publishChecklist`, que no sabe de React y se prueba sin
 * navegador. Aquí solo se pinta.
 */
export default function PublishChecklist({
  draft,
  onGoToField,
}: {
  draft: PublishDraft;
  /** Lleva al campo: cambia de paso si hace falta y lo enfoca. */
  onGoToField: (field: string) => void;
}): React.ReactNode {
  const t = useTranslations("publish");
  const items = publishChecklist(draft);
  const blocking = publishBlockingCount(items);

  return (
    <section aria-labelledby="publish-checklist-heading">
      <h2
        id="publish-checklist-heading"
        className="mb-2 text-caption font-semibold uppercase tracking-[0.14em] text-text-muted"
      >
        {t("checklistLabel")}
      </h2>

      {/* El resumen en una frase, para no obligar a contar los puntos. Y separa lo que **impide**
          publicar de lo que solo se recomienda: sin esa distinción, quien ve pendientes cree que
          todavía no puede enviar. */}
      <p
        className="mb-3 text-label text-text-support"
        data-testid="publish-checklist-summary"
      >
        {blocking === 0
          ? t("checklistReady")
          : t("checklistPending", { count: blocking })}
      </p>

      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onGoToField(item.field)}
              data-testid={`publish-check-${item.id}`}
              data-done={item.done ? "true" : "false"}
              className="focus-ring flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left transition-colors hover:bg-surface-elevation-2"
            >
              <span
                /* La marca es forma **y** color: un círculo hueco y una palomita no se confunden
                   aunque el verde y el gris se vean iguales. */
                aria-hidden="true"
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border",
                  item.done
                    ? "border-transparent bg-button-primary-bg text-button-primary-text"
                    : "border-separator text-transparent",
                )}
              >
                <MdCheck className="size-3.5" />
              </span>

              <span
                className={cn(
                  "text-label",
                  item.done
                    ? "text-text-support line-through"
                    : "text-text-base",
                )}
              >
                {t(item.labelKey)}
              </span>

              {/* Lo dice en palabras y no solo con un tono más claro: «recomendado» es la
                  diferencia entre «me falta» y «me bloquea». */}
              {item.optional ? (
                <span className="ml-auto text-caption text-text-muted">
                  {t("checklistOptional")}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
