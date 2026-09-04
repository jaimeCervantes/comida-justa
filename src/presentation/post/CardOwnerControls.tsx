"use client";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { MdEdit } from "react-icons/md";
import { carriesInventory } from "~/domain/entities/post/stock";
import { Link } from "~/i18n/navigation";
import { Button } from "~/presentation/design_system/buttons/Button";
import { type AvailabilityState, setAvailability } from "./availabilityAction";
import StockControl from "./StockControl/StockControl";
import { setStock } from "./stockAction";

/**
 * Editar y marcar agotado, sin salir del listado.
 *
 * Es la versión de tarjeta de lo que la publicación ya ofrecía en su página. Existe porque el
 * camino real de un vendedor es mirar su catálogo y arreglar lo que ve: obligarle a abrir cada
 * publicación para apagar tres cosas que se acabaron convierte un minuto en cinco.
 *
 * Ocultarlo a quien no lo administra es cortesía, no seguridad — quien decide es el servidor, que
 * vuelve a preguntárselo al dominio antes de escribir.
 *
 * **El interruptor manual y el inventario no conviven**, igual que en la ficha: en cuanto un
 * producto lleva la cuenta, agotarlo es poner 0 y `is_available` se deriva de ahí. Dos mandos para
 * lo mismo podrían contradecirse —un producto marcado agotado a mano con 5 unidades guardadas no
 * sabría qué contestar—, y la regla se le pregunta a `carriesInventory`, el mismo sitio que decide
 * en `OwnerControls`. Que la tarjeta y la ficha respondan distinto sería la clase de incoherencia
 * que hace dudar de si algo falló.
 */
export default function CardOwnerControls({
  postId,
  slug,
  kind,
  isAvailable,
  isSellable,
  stockQuantity,
  onAvailabilityChange,
}: {
  postId: string;
  slug: string;
  kind?: string | null;
  isAvailable: boolean;
  /** Un anuncio no se agota: solo se le ofrece editar. */
  isSellable: boolean;
  /** Lo guardado en `posts.stock_quantity`. `null` = no lleva inventario. */
  stockQuantity?: number | null;
  onAvailabilityChange?: (isAvailable: boolean) => void;
}) {
  const t = useTranslations("post");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  async function updateAvailability(
    previousState: AvailabilityState,
    formData: FormData,
  ): Promise<AvailabilityState> {
    const result = await setAvailability(previousState, formData);

    if (typeof result.isAvailable === "boolean") {
      onAvailabilityChange?.(result.isAvailable);
    }

    return result;
  }

  const [state, availabilityAction, isPending] = useActionState<
    AvailabilityState,
    FormData
  >(updateAvailability, {});

  const available = state.isAvailable ?? isAvailable;
  const tracksInventory = carriesInventory({ stockQuantity });

  return (
    <span
      data-testid="card-owner-controls"
      className="mt-2 mb-2 flex flex-col items-start gap-2"
    >
      <span className="flex flex-wrap items-center gap-2">
        <Link href={{ pathname: "/editar/[slug]", params: { slug } }}>
          <Button startIcon={<MdEdit />} size="xs">
            {t("edit")}
          </Button>
        </Link>

        {isSellable && !tracksInventory ? (
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
              disabled={!isHydrated || isPending}
            >
              {available ? t("markSoldOut") : t("markAvailable")}
            </Button>
          </form>
        ) : null}

        {state.errorMessage ? (
          <span
            data-testid="card-availability-error"
            className="text-sm text-brand-clay-700"
          >
            {state.errorMessage}
          </span>
        ) : null}
      </span>

      {/* El mismo campo del panel y de la ficha: guardar desde aquí es la misma acción, así que no
          hay forma de que el número quede distinto según por dónde se entre. */}
      <StockControl
        action={setStock}
        postId={postId}
        slug={slug}
        kind={kind}
        stockQuantity={stockQuantity ?? null}
        compact
      />
    </span>
  );
}
