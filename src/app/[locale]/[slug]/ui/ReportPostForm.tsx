"use client";

import { useActionState } from "react";
import { reportPost } from "../reportActions";

export type ReportLabels = {
  cta: string;
  heading: string;
  placeholder: string;
  done: string;
  reasons: ReadonlyArray<{ value: string; label: string }>;
};

type Props = {
  postId: string;
  labels: ReportLabels;
};

/**
 * El aviso de la comunidad: lo que atrapa lo que el clasificador dejó pasar.
 *
 * Es Client Component solo por el acuse de recibo. Sin él, quien pulsa no tiene forma de saber si
 * su aviso llegó —la publicación no cambia a la vista, y no puede cambiar: denunciar avisa, no
 * oculta— así que volvería a pulsar, o se iría creyendo que no funcionó.
 *
 * Los textos llegan ya traducidos desde el servidor. El motivo está redactado como **pregunta a
 * quien denuncia** («No tiene que ver con salud ni bienestar») y no como el nombre que lee el admin
 * («off_topic» → «No trata de descanso, alimentación…»): mismo código, dos redacciones, igual que
 * hizo `origin` con el selector del vendedor y el reporte.
 */
export default function ReportPostForm({ postId, labels }: Props) {
  const [state, action, pending] = useActionState(reportPost, {});

  if (state.done) {
    return (
      <p data-testid="report-done" className="text-sm text-text-support mt-6">
        {labels.done}
      </p>
    );
  }

  return (
    <form
      action={action}
      data-testid="report-form"
      className="mt-6 flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="postId" value={postId} />
      <span className="text-sm text-text-support">{labels.heading}</span>
      <select
        name="reason"
        required
        defaultValue=""
        aria-label={labels.heading}
        data-testid="report-reason"
        className="text-sm border rounded px-1 py-0.5 bg-transparent"
      >
        <option value="" disabled>
          {labels.placeholder}
        </option>
        {labels.reasons.map((reason) => (
          <option key={reason.value} value={reason.value}>
            {reason.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        data-testid="report-submit"
        className="text-sm underline text-pw-green hover:text-highlight disabled:opacity-50"
      >
        {labels.cta}
      </button>
    </form>
  );
}
