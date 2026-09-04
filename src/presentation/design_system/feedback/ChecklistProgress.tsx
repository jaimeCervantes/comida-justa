import type { ReactNode } from "react";
import { MdCheckCircle, MdRadioButtonUnchecked } from "react-icons/md";
import { cn } from "../styling/merge-class-names";

export interface ChecklistProgressItem {
  id: string;
  /** Qué hay que hacer, ya traducido y escrito en imperativo («Sube el logo de tu tienda»). */
  label: string;
  done: boolean;
  /** Por qué vale la pena. Solo se lee en los pendientes: en los cumplidos ya no aconseja nada. */
  hint?: string;
  /**
   * Qué ofrecer para resolverlo — normalmente un enlace.
   *
   * Lo arma quien llama porque un `Link` de `~/i18n/navigation` necesita el idioma activo, y esta
   * carpeta tiene que poder pintarse fuera del árbol de next-intl.
   */
  action?: ReactNode;
}

/**
 * Una lista de pasos con su avance: cuántos van y qué falta.
 *
 * **La barra no es el dato, es el eco del dato.** El número («3 de 5») va escrito y la barra solo lo
 * dibuja, con `aria-hidden`: una barra es la peor forma de contar cinco cosas para quien no la ve, y
 * duplicarla en el árbol de accesibilidad haría que se anunciara dos veces.
 *
 * **El estado de cada paso nunca es solo el color.** Cada renglón lleva su icono —marcado o vacío— y
 * su texto de estado, por el mismo motivo por el que `Alert` exige una etiqueta de tono: quien no
 * distingue verde de gris tiene que poder leer la lista igual.
 *
 * **No traduce nada.** Vive en el design system, así que los textos —la etiqueta, el resumen, los
 * nombres de los dos estados— llegan hechos, igual que en `EmptyState` y `Alert`.
 */
export function ChecklistProgress({
  items,
  summary,
  statusLabels,
  testId,
  className,
}: {
  items: readonly ChecklistProgressItem[];
  /** El avance escrito: «3 de 5 listos». */
  summary: string;
  /** Cómo se llama cada estado, para quien no ve el icono. */
  statusLabels: { done: string; pending: string };
  testId?: string;
  className?: string;
}) {
  const done = items.filter((item) => item.done).length;
  const ratio = items.length === 0 ? 0 : done / items.length;

  return (
    <div data-testid={testId} className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-text-support">{summary}</p>

        <div
          aria-hidden
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevation-2"
        >
          <div
            className="h-full rounded-full bg-feedback-success transition-[width] duration-(--duration-base) ease-(--ease-natural)"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      </div>

      <ol className="flex flex-col gap-1">
        {items.map((item) => (
          <li
            key={item.id}
            data-testid={`${testId}-item`}
            data-done={item.done}
            className="flex flex-wrap items-start gap-x-3 gap-y-1 rounded-control px-2 py-2 -mx-2"
          >
            <ChecklistMark done={item.done} statusLabels={statusLabels} />

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                className={cn(
                  "text-sm",
                  item.done
                    ? "text-text-support"
                    : "font-medium text-text-base",
                )}
              >
                {item.label}
              </span>

              {!item.done && item.hint ? (
                <span className="text-caption text-text-support text-pretty">
                  {item.hint}
                </span>
              ) : null}
            </div>

            {!item.done && item.action ? (
              <div className="shrink-0">{item.action}</div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ChecklistMark({
  done,
  statusLabels,
}: {
  done: boolean;
  statusLabels: { done: string; pending: string };
}) {
  const Icon = done ? MdCheckCircle : MdRadioButtonUnchecked;

  return (
    <span
      className={cn(
        "mt-0.5 shrink-0",
        done ? "text-feedback-success" : "text-text-muted",
      )}
    >
      <Icon size="20" aria-hidden />
      <span className="sr-only">
        {done ? statusLabels.done : statusLabels.pending}
      </span>
    </span>
  );
}
