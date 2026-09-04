"use client";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { MdEdit } from "react-icons/md";
import { carriesInventory } from "~/domain/entities/post/stock";
import { Link } from "~/i18n/navigation";
import { Button } from "~/presentation/design_system/buttons/Button";
import type { AvailabilityState } from "~/presentation/post/availabilityAction";
import StockControl from "~/presentation/post/StockControl/StockControl";
import type { StockState } from "~/presentation/post/stockAction";

/**
 * Lo que ve quien administra la publicación: editar, cambiar la disponibilidad y llevar el
 * inventario.
 *
 * Ocultarlo es cortesía, no seguridad — quien decide es el servidor, que vuelve a preguntárselo al
 * dominio antes de escribir.
 *
 * **No todo el que administra, edita.** Desde esta entrega el dueño de una tienda puede llevar el
 * inventario de lo que se vende en ella aunque lo publicara otra mano; lo que **no** puede es
 * reescribir el texto ajeno, que sigue siendo de quien lo escribió y a quien `UpdateOnePostUseCase`
 * sigue exigiendo. De ahí que la sección tenga dos permisos y no uno: enseñarle un botón de editar
 * que el servidor le va a negar sería mentirle.
 *
 * **El interruptor manual y el inventario no conviven.** En cuanto un producto lleva la cuenta,
 * agotarlo es poner 0 y `is_available` se deriva de ahí; dejar además el botón sería ofrecer dos
 * mandos para lo mismo, capaces de contradecirse — un producto marcado agotado a mano con 5
 * unidades guardadas no sabría qué contestar. Mientras no lleve inventario, el botón es el único
 * mando y se ve igual que siempre.
 */
export default function OwnerControls({
  action,
  stockAction,
  postId,
  slug,
  kind,
  isAvailable,
  isSellable,
  stockQuantity,
  canEdit,
}: {
  action: (
    state: AvailabilityState,
    data: FormData,
  ) => Promise<AvailabilityState>;
  stockAction: (state: StockState, data: FormData) => Promise<StockState>;
  postId: string;
  slug: string;
  kind?: string | null;
  isAvailable: boolean;
  /** Un anuncio no se agota: solo se le ofrece editar. */
  isSellable: boolean;
  /** Lo guardado en `posts.stock_quantity`. `null` = no lleva inventario. */
  stockQuantity: number | null;
  /** Solo quien la escribió: el texto y el interruptor manual siguen siendo suyos. */
  canEdit: boolean;
}) {
  const t = useTranslations("post");
  const [state, availabilityAction, isPending] = useActionState<
    AvailabilityState,
    FormData
  >(action, {});

  const available = state.isAvailable ?? isAvailable;
  const tracksInventory = carriesInventory({ stockQuantity });

  return (
    <section
      data-testid="owner-controls"
      className="mt-6 flex flex-col gap-4 border-t border-separator pt-4"
    >
      <div className="flex flex-wrap items-center gap-3 empty:hidden">
        {canEdit ? (
          <Link href={{ pathname: "/editar/[slug]", params: { slug } }}>
            <Button startIcon={<MdEdit />} size="sm">
              {t("edit")}
            </Button>
          </Link>
        ) : null}

        {canEdit && isSellable && !tracksInventory ? (
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
              {available ? t("markSoldOut") : t("markAvailable")}
            </Button>
          </form>
        ) : null}

        {state.errorMessage ? (
          <p data-testid="availability-error" className="text-brand-clay-700">
            {state.errorMessage}
          </p>
        ) : null}
      </div>

      <StockControl
        action={stockAction}
        postId={postId}
        slug={slug}
        kind={kind}
        stockQuantity={stockQuantity}
      />
    </section>
  );
}
