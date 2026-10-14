"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "~/presentation/design_system/buttons/Button";

/** Lo que contesta una acción de borrar cuando no pudo: borrar con éxito lleva a la lista. */
export interface DeleteState {
  error?: string;
}

interface ConfirmDeleteProps {
  /** La acción de servidor que borra: recibe `id` en el formulario. */
  action: (state: DeleteState, formData: FormData) => Promise<DeleteState>;
  id: string;
  /** «Borrar grupo». */
  triggerLabel: string;
  /** Qué se borra y qué más se va con ello: borrar no se puede deshacer. */
  question: string;
}

/**
 * Borrar en dos pasos: el primer botón solo pregunta, y la pregunta dice qué más se va —el
 * historial de un grupo, el pie de unas publicaciones—. No es un `window.confirm`: ese diálogo no se
 * puede leer bien en un teléfono ni traducir, y bloquea la página entera.
 */
export default function ConfirmDelete({
  action,
  id,
  triggerLabel,
  question,
}: ConfirmDeleteProps) {
  const t = useTranslations("outreach");
  const [asking, setAsking] = useState(false);
  const [state, formAction, isPending] = useActionState<DeleteState, FormData>(
    action,
    {},
  );

  return (
    <section
      data-testid="outreach-delete"
      className="mt-10 border-t border-separator pt-6"
    >
      {asking ? (
        <form
          action={formAction}
          aria-label={triggerLabel}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="id" value={id} />
          <p role="alert" className="text-sm font-semibold text-brand-clay-700">
            {question}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              color="orange"
              isLoading={isPending}
              disabled={isPending}
              loadingLabel={t("deleting")}
            >
              {isPending ? t("deleting") : t("confirmDelete")}
            </Button>
            <Button disabled={isPending} onClick={() => setAsking(false)}>
              {t("cancelDelete")}
            </Button>
          </div>
        </form>
      ) : (
        <Button onClick={() => setAsking(true)}>{triggerLabel}</Button>
      )}

      {state.error ? (
        <p role="alert" className="mt-3 text-sm text-brand-clay-700">
          {state.error}
        </p>
      ) : null}
    </section>
  );
}
