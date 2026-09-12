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

/**
 * Cuánta gente lo apoyó.
 *
 * En `compact` se pinta el número pelado y la frase entera se dice en `sr-only`. No es
 * ahorro cosmético: «Nadie ha apoyado» mide unos 110px, y en una tarjeta de 292 eso era lo que
 * partía en dos la fila de acciones — el carrito y apoyar arriba, editar y agotar abajo—. Con el
 * número, la fila entera cabe en un renglón, que era la condición.
 *
 * Quien navega escuchando sigue oyendo la frase completa: lo que se acorta es lo que se pinta.
 *
 * **Y se dice con `sr-only`, no con `aria-label`.** Un `span` sin papel propio no admite nombre
 * accesible: el atributo se queda escrito en el HTML y ningún lector lo lee. El texto escondido
 * sí llega, y además sigue contando como contenido, que es por donde lo afirman las pruebas.
 */
function PostReactionCount({
  count,
  compact = false,
}: {
  count: number;
  compact?: boolean;
}) {
  const t = useTranslations("post");
  const phrase = t("reactionCount", { count });

  return (
    <span
      className="text-label text-text-support"
      data-testid="post-reaction-count"
      title={compact ? phrase : undefined}
    >
      {compact ? (
        <>
          <span aria-hidden>{count}</span>
          <span className="sr-only">{phrase}</span>
        </>
      ) : (
        phrase
      )}
    </span>
  );
}

export default function PostReactionButton({
  postId,
  reacted,
  reactions,
  canReact,
  signInHref = "/auth/signin",
  iconOnly = false,
}: {
  postId: string;
  reacted: boolean;
  reactions: number;
  canReact: boolean;
  signInHref?: string;
  /**
   * Solo el corazón, sin la palabra.
   *
   * Para la tarjeta de un listado. **La cuenta se queda** aunque el verbo se vaya: es un dato de la
   * publicación —cuánta gente la apoyó— y no la etiqueta del botón, así que quitarla escondería
   * información en vez de ahorrar espacio.
   */
  iconOnly?: boolean;
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
          aria-label={iconOnly ? t("reactionSignIn") : undefined}
          className={
            iconOnly
              ? "focus-ring inline-flex size-8 items-center justify-center rounded-full border border-separator text-pw-green"
              : "focus-ring inline-flex items-center gap-1 rounded-chip text-label font-semibold text-pw-green underline underline-offset-4"
          }
        >
          <MdFavoriteBorder size="18" aria-hidden />
          {iconOnly ? null : t("reactionSignIn")}
        </a>
        <PostReactionCount count={state.reactions} compact={iconOnly} />
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
        iconOnly={iconOnly}
        aria-label={
          iconOnly
            ? state.reacted
              ? t("reactionWithdraw")
              : t("reactionSupport")
            : undefined
        }
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
        {iconOnly
          ? null
          : state.reacted
            ? t("reactionWithdraw")
            : t("reactionSupport")}
      </Button>
      <PostReactionCount count={state.reactions} compact={iconOnly} />
    </form>
  );
}
