"use client";

import { useActionState } from "react";
import { reportComment } from "../commentReportActions";
import type { ReportLabels } from "./ReportPostForm";

type Props = {
  commentId: string;
  labels: ReportLabels;
};

/**
 * El aviso de la comunidad sobre un comentario, calcado de `ReportPostForm`. Vive aparte y no como
 * el mismo componente parametrizado porque uno se monta una vez por ficha y este se repite una vez
 * por comentario, con su propio tamaño de texto.
 */
export default function ReportCommentForm({ commentId, labels }: Props) {
  const [state, action, pending] = useActionState(reportComment, {});

  if (state.done) {
    return (
      <p
        data-testid="comment-report-done"
        className="text-xs text-text-support mt-1"
      >
        {labels.done}
      </p>
    );
  }

  return (
    <form
      action={action}
      data-testid="comment-report-form"
      className="mt-1 flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="commentId" value={commentId} />
      <select
        name="reason"
        required
        defaultValue=""
        aria-label={labels.heading}
        data-testid="comment-report-reason"
        className="text-xs border rounded px-1 py-0.5 bg-transparent"
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
        data-testid="comment-report-submit"
        className="text-xs underline text-pw-green hover:text-highlight disabled:opacity-50"
      >
        {labels.cta}
      </button>
    </form>
  );
}
