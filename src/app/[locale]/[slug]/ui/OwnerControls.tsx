"use client";
import Link from "next/link";
import { useActionState } from "react";
import { MdEdit } from "react-icons/md";
import { Button } from "~/presentation/design_system/buttons/Button";
import type { AvailabilityState } from "../actions";

export const MARK_SOLD_OUT_LABEL = "Marcar agotado";
export const MARK_AVAILABLE_LABEL = "Volver a ofrecer";

/**
 * Lo que solo ve quien publicó: editar y cambiar la disponibilidad.
 *
 * Ocultarlo es cortesía, no seguridad — quien decide es el servidor, que compara el dueño de la
 * publicación contra la sesión.
 */
export default function OwnerControls({
  action,
  postId,
  slug,
  isAvailable,
  isSellable,
}: {
  action: (
    state: AvailabilityState,
    data: FormData,
  ) => Promise<AvailabilityState>;
  postId: string;
  slug: string;
  isAvailable: boolean;
  /** Un anuncio no se agota: solo se le ofrece editar. */
  isSellable: boolean;
}) {
  const [state, availabilityAction, isPending] = useActionState<
    AvailabilityState,
    FormData
  >(action, {});

  const available = state.isAvailable ?? isAvailable;

  return (
    <section
      data-testid="owner-controls"
      className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-4 dark:border-gray-800"
    >
      <Link href={`/editar/${slug}`}>
        <Button startIcon={<MdEdit />} size="sm">
          Editar
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
            size="sm"
            color={available ? "default" : "green"}
            isLoading={isPending}
            disabled={isPending}
          >
            {available ? MARK_SOLD_OUT_LABEL : MARK_AVAILABLE_LABEL}
          </Button>
        </form>
      ) : null}

      {state.errorMessage ? (
        <p
          data-testid="availability-error"
          className="text-red-700 dark:text-red-400"
        >
          {state.errorMessage}
        </p>
      ) : null}
    </section>
  );
}
