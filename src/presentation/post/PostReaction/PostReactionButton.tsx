"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { usePathname } from "~/i18n/navigation";
import { Button } from "~/presentation/design_system/buttons/Button";
import {
  type PostReactionActionState,
  setPostReaction,
} from "./postReactionAction";

function PostReactionCount({ count }: { count: number }) {
  const t = useTranslations("post");

  return (
    <span
      className="text-label text-text-support"
      data-testid="post-reaction-count"
    >
      {t("reactionCount", { count })}
    </span>
  );
}

export default function PostReactionButton({
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
    PostReactionActionState,
    FormData
  >(setPostReaction, { reacted, reactions });

  if (!canReact || state.needsSignIn) {
    return (
      <span
        className="inline-flex flex-wrap items-center gap-2"
        data-testid="post-reaction"
      >
        <a
          href={signInHref}
          data-testid="post-reaction-signin"
          className="focus-ring inline-flex items-center gap-1 rounded-chip text-label font-semibold text-pw-green underline underline-offset-4"
        >
          <MdFavoriteBorder size="18" aria-hidden />
          {t("reactionSignIn")}
        </a>
        <PostReactionCount count={state.reactions} />
      </span>
    );
  }

  return (
    <form
      action={action}
      className="inline-flex flex-wrap items-center gap-2"
      data-testid="post-reaction"
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
        data-testid="post-reaction-toggle"
        startIcon={
          state.reacted ? (
            <MdFavorite aria-hidden size="18" />
          ) : (
            <MdFavoriteBorder aria-hidden size="18" />
          )
        }
        loadingLabel={t("reactionLoading")}
      >
        {state.reacted ? t("reactionWithdraw") : t("reactionSupport")}
      </Button>
      <PostReactionCount count={state.reactions} />
    </form>
  );
}
