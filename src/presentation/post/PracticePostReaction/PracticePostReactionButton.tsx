"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { usePathname } from "~/i18n/navigation";
import { Button } from "~/presentation/design_system/buttons/Button";
import {
  type PracticePostReactionActionState,
  setPracticePostReaction,
} from "./practicePostReactionAction";

function PracticePostReactionCount({ count }: { count: number }) {
  const t = useTranslations("post");

  return (
    <span
      className="text-label text-text-support"
      data-testid="practice-post-reaction-count"
    >
      {t("practiceReactionCount", { count })}
    </span>
  );
}

export default function PracticePostReactionButton({
  postId,
  reacted,
  reactions,
  canReact,
  signInHref = "/auth/signin",
}: {
  postId: string;
  reacted: boolean;
  reactions: number;
  canReact: boolean;
  signInHref?: string;
}) {
  const t = useTranslations("post");
  const pathname = usePathname();
  const [state, action, isPending] = useActionState<
    PracticePostReactionActionState,
    FormData
  >(setPracticePostReaction, { reacted, reactions });

  if (!canReact || state.needsSignIn) {
    return (
      <span
        className="inline-flex flex-wrap items-center gap-2"
        data-testid="practice-post-reaction"
      >
        <a
          href={signInHref}
          data-testid="practice-post-reaction-signin"
          className="focus-ring inline-flex items-center gap-1 rounded-chip text-label font-semibold text-pw-green underline underline-offset-4"
        >
          <MdFavoriteBorder size="18" aria-hidden />
          {t("practiceReactionSignIn")}
        </a>
        <PracticePostReactionCount count={state.reactions} />
      </span>
    );
  }

  return (
    <form
      action={action}
      className="inline-flex flex-wrap items-center gap-2"
      data-testid="practice-post-reaction"
    >
      <input type="hidden" name="postId" value={postId} />
      <input
        type="hidden"
        name="intent"
        value={state.reacted ? "withdraw" : "support"}
      />
      <input type="hidden" name="path" value={pathname || "/"} />
      <Button
        type="submit"
        size="xs"
        color={state.reacted ? "default" : "green"}
        isLoading={isPending}
        disabled={isPending}
        data-testid="practice-post-reaction-toggle"
        startIcon={
          state.reacted ? (
            <MdFavorite aria-hidden size="18" />
          ) : (
            <MdFavoriteBorder aria-hidden size="18" />
          )
        }
        loadingLabel={t("practiceReactionLoading")}
      >
        {state.reacted
          ? t("practiceReactionWithdraw")
          : t("practiceReactionSupport")}
      </Button>
      <PracticePostReactionCount count={state.reactions} />
    </form>
  );
}
