import { MODERATION_REASONS } from "~/domain/entities/post/moderation";
import type { ModeratedComment } from "~/use_cases/moderateComment/ports/ICommentModerationRepository";
import { decideCommentModeration } from "../actions";

/** Las etiquetas ya traducidas, para que este componente no vuelva a leer el catálogo. */
export interface CommentQueueLabels {
  empty: string;
  columnComment: string;
  columnAuthor: string;
  columnPost: string;
  columnStatus: string;
  columnReason: string;
  columnDate: string;
  approve: string;
  reject: string;
  reasonPlaceholder: string;
  statusInReview: string;
  statusRejected: string;
  statusPublished: string;
  viewPost: string;
  reportCount: (count: number) => string;
  reasons: Record<string, string>;
}

const STATUS_LABEL: Record<
  ModeratedComment["status"],
  (labels: CommentQueueLabels) => string
> = {
  published: (labels) => labels.statusPublished,
  in_review: (labels) => labels.statusInReview,
  rejected: (labels) => labels.statusRejected,
};

interface Props {
  comments: readonly ModeratedComment[];
  labels: CommentQueueLabels;
  /** Para construir el enlace a la ficha: `/{locale}/{slug}#comments`. */
  locale: string;
}

function formatDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "—";
}

function Row({
  comment,
  labels,
  locale,
}: {
  comment: ModeratedComment;
  labels: CommentQueueLabels;
  locale: string;
}) {
  return (
    <li
      data-testid={`comment-moderation-row-${comment.id}`}
      className="flex flex-wrap items-center gap-3 py-3 border-b border-separator"
    >
      <span className="min-w-[14rem] max-w-[20rem] line-clamp-2">
        {comment.content}
      </span>

      <span className="text-sm text-text-support min-w-[8rem]">
        {comment.authorName ?? "—"}
      </span>

      {comment.postSlug ? (
        <a
          href={`/${locale}/${comment.postSlug}#comments`}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline text-pw-green hover:text-highlight min-w-[8rem]"
        >
          {comment.postTitle || labels.viewPost}
        </a>
      ) : (
        <span className="text-sm text-text-support min-w-[8rem]">—</span>
      )}

      <span
        data-testid={`comment-moderation-status-${comment.id}`}
        className="text-xs px-2 py-0.5 rounded-full bg-surface-elevation-2 text-text-support"
      >
        {STATUS_LABEL[comment.status](labels)}
      </span>

      {comment.reportCount > 0 ? (
        <span
          data-testid={`comment-moderation-reports-${comment.id}`}
          className="text-xs px-2 py-0.5 rounded-full bg-feedback-warning/15 text-text-base"
        >
          {labels.reportCount(comment.reportCount)}
        </span>
      ) : null}

      <span
        data-testid={`comment-moderation-reason-label-${comment.id}`}
        className="text-sm text-text-support min-w-[12rem]"
      >
        {comment.reason ? labels.reasons[comment.reason] : "—"}
      </span>

      <span className="text-xs text-text-muted">
        {formatDate(comment.reviewedAt ?? comment.createdAt)}
      </span>

      <span className="ml-auto flex items-center gap-2">
        <form action={decideCommentModeration} className="inline">
          <input type="hidden" name="commentId" value={comment.id} />
          <input type="hidden" name="action" value="approve" />
          <button
            type="submit"
            data-testid={`comment-moderation-approve-${comment.id}`}
            className="text-sm underline text-pw-green hover:text-highlight"
          >
            {labels.approve}
          </button>
        </form>

        <form action={decideCommentModeration} className="inline flex gap-2">
          <input type="hidden" name="commentId" value={comment.id} />
          <input type="hidden" name="action" value="reject" />
          <select
            name="reason"
            required
            defaultValue=""
            aria-label={labels.columnReason}
            data-testid={`comment-moderation-reason-${comment.id}`}
            className="text-sm border rounded px-1 py-0.5 bg-transparent"
          >
            <option value="" disabled>
              {labels.reasonPlaceholder}
            </option>
            {MODERATION_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {labels.reasons[reason]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            data-testid={`comment-moderation-reject-${comment.id}`}
            className="text-sm underline text-pw-green hover:text-highlight"
          >
            {labels.reject}
          </button>
        </form>
      </span>
    </li>
  );
}

export default function CommentModerationQueue({
  comments,
  labels,
  locale,
}: Props) {
  if (comments.length === 0) {
    return (
      <p data-testid="comment-moderation-empty" className="text-text-support">
        {labels.empty}
      </p>
    );
  }

  return (
    <ul data-testid="comment-moderation-queue" className="list-none p-0">
      {comments.map((comment) => (
        <Row
          key={comment.id}
          comment={comment}
          labels={labels}
          locale={locale}
        />
      ))}
    </ul>
  );
}
