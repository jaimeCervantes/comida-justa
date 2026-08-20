import { MODERATION_REASONS } from "~/domain/entities/post/moderation";
import type { ModeratedPost } from "~/use_cases/moderatePost/ports/IModerationRepository";
import { decideModeration } from "../actions";

/** Las etiquetas ya traducidas, para que este componente no vuelva a leer el catálogo. */
export interface QueueLabels {
  empty: string;
  columnPost: string;
  columnAuthor: string;
  columnStatus: string;
  columnReason: string;
  columnDate: string;
  approve: string;
  reject: string;
  reasonPlaceholder: string;
  statusInReview: string;
  statusRejected: string;
  statusPublished: string;
  /** Ya formateado con su plural por quien tiene el catálogo; aquí solo se pinta. */
  reportCount: (count: number) => string;
  reasons: Record<string, string>;
}

/** Cada estado dice lo que es. Cerrado: un estado nuevo obliga a decidir cómo se llama. */
const STATUS_LABEL: Record<
  ModeratedPost["status"],
  (labels: QueueLabels) => string
> = {
  published: (labels) => labels.statusPublished,
  in_review: (labels) => labels.statusInReview,
  rejected: (labels) => labels.statusRejected,
};

interface Props {
  posts: readonly ModeratedPost[];
  labels: QueueLabels;
}

function formatDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "—";
}

function Row({ post, labels }: { post: ModeratedPost; labels: QueueLabels }) {
  return (
    <li
      data-testid={`moderation-row-${post.id}`}
      className="flex flex-wrap items-center gap-3 py-3 border-b border-separator"
    >
      <span className="min-w-[14rem] font-semibold">{post.title}</span>

      <span className="text-sm text-text-support min-w-[8rem]">
        {post.authorName ?? "—"}
      </span>

      <span
        data-testid={`moderation-status-${post.id}`}
        className="text-xs px-2 py-0.5 rounded-full bg-surface-elevation-2 text-text-support"
      >
        {/* Una publicada que llegó aquí por una denuncia SIGUE publicada: denunciar avisa, no
            oculta. Decir "en revisión" sobre algo que cualquiera puede ver sería mentir en la
            única pantalla donde el admin decide. */}
        {STATUS_LABEL[post.status](labels)}
      </span>

      {/* La señal más fuerte que produce este sistema: varias personas distintas avisando de lo
          mismo. Se pinta solo cuando la hay, para que su ausencia no compita con el estado. */}
      {post.reportCount > 0 ? (
        <span
          data-testid={`moderation-reports-${post.id}`}
          className="text-xs px-2 py-0.5 rounded-full bg-feedback-warning/15 text-text-base"
        >
          {labels.reportCount(post.reportCount)}
        </span>
      ) : null}

      <span
        data-testid={`moderation-reason-label-${post.id}`}
        className="text-sm text-text-support min-w-[12rem]"
      >
        {post.reason ? labels.reasons[post.reason] : "—"}
      </span>

      <span className="text-xs text-text-muted">
        {formatDate(post.reviewedAt ?? post.createdAt)}
      </span>

      <span className="ml-auto flex items-center gap-2">
        <form action={decideModeration} className="inline">
          <input type="hidden" name="postId" value={post.id} />
          <input type="hidden" name="action" value="approve" />
          <button
            type="submit"
            data-testid={`moderation-approve-${post.id}`}
            className="text-sm underline text-pw-green hover:text-highlight"
          >
            {labels.approve}
          </button>
        </form>

        {/* Bajar exige elegir motivo: sin él, el autor vería un aviso que no explica nada. */}
        <form action={decideModeration} className="inline flex gap-2">
          <input type="hidden" name="postId" value={post.id} />
          <input type="hidden" name="action" value="reject" />
          <select
            name="reason"
            required
            defaultValue=""
            aria-label={labels.columnReason}
            data-testid={`moderation-reason-${post.id}`}
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
            data-testid={`moderation-reject-${post.id}`}
            className="text-sm underline text-pw-green hover:text-highlight"
          >
            {labels.reject}
          </button>
        </form>
      </span>
    </li>
  );
}

export default function ModerationQueue({ posts, labels }: Props) {
  if (posts.length === 0) {
    return (
      <p data-testid="moderation-empty" className="text-text-support">
        {labels.empty}
      </p>
    );
  }

  return (
    <ul data-testid="moderation-queue" className="list-none p-0">
      {posts.map((post) => (
        <Row key={post.id} post={post} labels={labels} />
      ))}
    </ul>
  );
}
