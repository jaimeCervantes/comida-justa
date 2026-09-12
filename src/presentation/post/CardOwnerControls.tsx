"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import {
  MdCheckCircle,
  MdEdit,
  MdMoreHoriz,
  MdRemoveShoppingCart,
} from "react-icons/md";
import { canTrackStock, carriesInventory } from "~/domain/entities/post/stock";
import { Link } from "~/i18n/navigation";
import { Button } from "~/presentation/design_system/buttons/Button";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { MENU_CONTENT_CLASS } from "~/presentation/design_system/styling/menuSurface";
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
 * **En la misma fila que el carrito y apoyar.** Editar y agotar son dos iconos más del renglón de
 * acciones: son acciones sobre la misma publicación y se leen juntas. Antes ocupaban renglones
 * propios —tres controles con texto, la mitad del alto de la tarjeta— y ese alto se lo cobraban
 * también a quien sólo viene a mirar. Por eso el envoltorio es `contents`: no crea una caja, así
 * que los iconos son hijos directos de la fila y se reparten con los demás en vez de formar un
 * grupo aparte que se parta entero al quedarse sin ancho.
 *
 * **El campo de existencias no entra en ese renglón, y por eso queda un menú.** Es un campo de
 * texto con su botón de guardar, no un icono; en una columna de 136px partiría la fila en tres.
 * Cuelga de un «⋯» que sólo aparece en lo que puede llevar cuenta — un producto.
 *
 * **El icono de agotar no se explica solo, y se asume.** No hay un dibujo que diga «marcar agotado»
 * sin leerlo, así que el botón conserva su nombre accesible completo y un `title`: quien pasa el
 * puntero lo lee, y quien navega escuchando lo oye. Es el precio de que quepa en la fila.
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
  /*
   * El panel se cierra solo al guardar, y no es cosmético: Radix abre en modo modal —deja el resto
   * de la página con `aria-hidden` y sin puntero—, así que un menú que sigue abierto después tapa
   * justo lo que se acaba de cambiar.
   */
  const [isOpen, setIsOpen] = useState(false);

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
  /* Distinto de `tracksInventory`, y la diferencia importa: `canTrackStock` dice "esto es un
     producto, podría contarse", y `carriesInventory` dice "ya se está contando". El campo aparece
     en el primer caso —nace vacío, y escribir el primer número es lo que lo pone a contar—; el
     interruptor manual desaparece en el segundo. Gatearlo con `tracksInventory` habría dejado sin
     salida a un producto que todavía no cuenta: no podría empezar nunca. */
  const tracksStock = canTrackStock({ kind });
  const availabilityLabel = available ? t("markSoldOut") : t("markAvailable");

  return (
    <span data-testid="card-owner-controls" className="contents">
      <Link
        href={{ pathname: "/editar/[slug]", params: { slug } }}
        aria-label={t("edit")}
        title={t("edit")}
        data-testid="card-edit"
        className={buttonVariants({ size: "xs", iconOnly: true })}
      >
        <MdEdit size="18" aria-hidden />
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
            iconOnly
            color={available ? "default" : "green"}
            aria-label={availabilityLabel}
            title={availabilityLabel}
            isLoading={isPending}
            disabled={!isHydrated || isPending}
            startIcon={
              available ? (
                <MdRemoveShoppingCart aria-hidden />
              ) : (
                <MdCheckCircle aria-hidden />
              )
            }
          />
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

      {tracksStock ? (
        <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
          {/* Un `button` pelado vestido con `buttonVariants`, y no el componente `Button`.
              `asChild` de Radix clona al hijo y le pasa **su propia ref** para anclar el panel;
              `Button` es una función que no la reenvía, así que la ref se perdía y el menú no
              llegaba a abrirse — en el navegador, no en jsdom, que no necesita anclar nada. Las
              clases son las mismas: para eso viven fuera del componente. */}
          <DropdownMenu.Trigger
            type="button"
            aria-label={t("ownerMenu")}
            title={t("ownerMenu")}
            data-testid="card-owner-menu-trigger"
            className={buttonVariants({ size: "xs", iconOnly: true })}
          >
            <MdMoreHoriz size="20" aria-hidden />
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className={MENU_CONTENT_CLASS}
              data-testid="card-owner-menu"
              /* Radix trata las letras y las flechas como navegación entre filas: sin esto no se
                 podría teclear un número en el campo. Se filtra por el origen en vez de apagarlo
                 entero, para que las teclas sigan moviendo el menú cuando el foco está en una
                 fila. */
              onKeyDown={(event) => {
                if (event.target instanceof HTMLInputElement)
                  event.stopPropagation();
              }}
            >
              <StockControl
                action={setStock}
                postId={postId}
                slug={slug}
                kind={kind}
                stockQuantity={stockQuantity ?? null}
                compact
              />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ) : null}
    </span>
  );
}
