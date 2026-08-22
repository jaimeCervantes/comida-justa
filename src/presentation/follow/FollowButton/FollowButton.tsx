"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { MdPersonAdd, MdPersonRemove } from "react-icons/md";
import { SIGNIN_PATH } from "~/infra/constants";
import { Button } from "~/presentation/design_system/buttons/Button";
import FollowerCount from "../FollowerCount";
import { type FollowState, toggleFollow } from "../followAction";

/**
 * Seguir a una tienda o a una persona, con lo que ya llevan siguiéndola.
 *
 * **Manda una intención, no un estado.** El formulario no dice «ahora quiero seguir»: dice «cambia
 * lo que haya». Con dos pestañas abiertas y vistas distintas, mandar el estado haría que la última
 * en llegar pisara a la otra; así el servidor lee lo que hay y hace lo contrario.
 *
 * **Con cero seguidores no se pinta número.** Lo decide `showsFollowerCount`, del dominio, y no un
 * `hidden`: hoy hay una tienda y un perfil reclamado en toda la base, así que un «0 seguidores»
 * saldría en el 100% de las páginas y convertiría una página nueva en una abandonada.
 */
export default function FollowButton({
  sellerId,
  followedId,
  followers,
  isFollowing,
  canFollow,
  path,
}: {
  /** Uno de los dos, nunca los dos: un seguimiento apunta a una sola cosa. */
  sellerId?: string | null;
  followedId?: string | null;
  followers: number;
  isFollowing: boolean;
  /** Si quien mira tiene sesión. Sin ella el botón **es** el enlace a entrar, no un botón que falla. */
  canFollow: boolean;
  /** La ruta a refrescar, para que el contador que ve el resto también quede al día. */
  path: string;
}) {
  const t = useTranslations("follow");
  const [state, action, isPending] = useActionState<FollowState, FormData>(
    toggleFollow,
    { following: isFollowing, followers },
  );

  const following = state.following;
  const total = state.followers;

  const count = <FollowerCount total={total} />;

  /* Sin sesión no se intenta y se falla: se lleva a entrar, y `callbackUrl` devuelve a la misma
     página. Un seguimiento que se pierde al cerrar el navegador no es un seguimiento, así que no
     hay forma de "seguir" como anónimo que valga la pena ofrecer.

     `state.needsSignIn` cubre además que la sesión caduque con la página abierta. */
  if (!canFollow || state.needsSignIn) {
    return (
      <span className="inline-flex items-center gap-3">
        <a
          href={`${SIGNIN_PATH}?callbackUrl=${encodeURIComponent(path)}`}
          data-testid="follow-signin"
          className="focus-ring inline-flex items-center gap-2 whitespace-nowrap rounded-control bg-pw-green px-2 py-2 text-sm text-white transition-colors hover:bg-pw-green/80"
        >
          <MdPersonAdd aria-hidden size="18" />
          {t("follow")}
        </a>
        {count}
      </span>
    );
  }

  return (
    <form action={action} className="inline-flex items-center gap-3">
      <input type="hidden" name="sellerId" value={sellerId ?? ""} />
      <input type="hidden" name="followedId" value={followedId ?? ""} />
      <input type="hidden" name="path" value={path} />

      <Button
        type="submit"
        size="sm"
        color={following ? "default" : "green"}
        isLoading={isPending}
        disabled={isPending}
        data-testid="follow-button"
        startIcon={
          following ? (
            <MdPersonRemove aria-hidden size="18" />
          ) : (
            <MdPersonAdd aria-hidden size="18" />
          )
        }
      >
        {following ? t("unfollow") : t("follow")}
      </Button>

      {count}
    </form>
  );
}
