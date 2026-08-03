"use client";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { MdEdit } from "react-icons/md";
import { Link } from "~/i18n/navigation";
import { Button } from "~/presentation/design_system/buttons/Button";
import { type AvailabilityState, setAvailability } from "./availabilityAction";

/**
 * Editar y marcar agotado, sin salir del listado.
 *
 * Es la versión de tarjeta de lo que la publicación ya ofrecía en su página. Existe porque el
 * camino real de un vendedor es mirar su catálogo y arreglar lo que ve: obligarle a abrir cada
 * publicación para apagar tres cosas que se acabaron convierte un minuto en cinco.
 *
 * Ocultarlo a quien no es el dueño es cortesía, no seguridad — quien decide es el servidor, que
 * compara el dueño de la publicación contra la sesión.
 */
export default function CardOwnerControls({
  postId,
  slug,
  isAvailable,
  isSellable,
}: {
  postId: string;
  slug: string;
  isAvailable: boolean;
  /** Un anuncio no se agota: solo se le ofrece editar. */
  isSellable: boolean;
}) {
  const t = useTranslations("post");
  const [state, availabilityAction, isPending] = useActionState<
    AvailabilityState,
    FormData
  >(setAvailability, {});

  const available = state.isAvailable ?? isAvailable;

  return (
    <span
      data-testid="card-owner-controls"
      className="mt-2 flex flex-wrap items-center gap-2"
    >
      <Link href={{ pathname: "/editar/[slug]", params: { slug } }}>
        <Button startIcon={<MdEdit />} size="xs">
          {t("edit")}
        </Button>
      </Link>

      {isSellable ? (
        <form action={availabilityAction}>
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="slug" value={slug} />
          <input
            type="hidden"
            name="isAvailable"
            value={available ? "false" : "true"}
          />
          <Button
            type="submit"
            size="xs"
            color={available ? "default" : "green"}
            isLoading={isPending}
            disabled={isPending}
          >
            {available ? t("markSoldOut") : t("markAvailable")}
          </Button>
        </form>
      ) : null}

      {state.errorMessage ? (
        <span
          data-testid="card-availability-error"
          className="text-sm text-red-700 dark:text-red-400"
        >
          {state.errorMessage}
        </span>
      ) : null}
    </span>
  );
}
