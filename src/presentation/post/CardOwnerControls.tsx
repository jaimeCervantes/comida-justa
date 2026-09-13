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
import {
  MENU_CONTENT_CLASS,
  MENU_ITEM_CLASS,
  MENU_SEPARATOR_CLASS,
} from "~/presentation/design_system/styling/menuSurface";
import { type AvailabilityState, setAvailability } from "./availabilityAction";
import StockControl from "./StockControl/StockControl";
import { setStock } from "./stockAction";

/**
 * Editar, agotar y recontar, sin salir del listado.
 *
 * Es la versión de tarjeta de lo que la publicación ya ofrecía en su página. Existe porque el
 * camino real de un vendedor es mirar su catálogo y arreglar lo que ve: obligarle a abrir cada
 * publicación para apagar tres cosas que se acabaron convierte un minuto en cinco.
 *
 * Ocultarlo a quien no lo administra es cortesía, no seguridad — quien decide es el servidor, que
 * vuelve a preguntárselo al dominio antes de escribir.
 *
 * **Los tres detrás de un «⋯», y esto se decidió midiendo.** Estuvieron sueltos en la fila de
 * acciones, que es donde se pidieron; en la tarjeta de un teléfono de pie la columna de texto son
 * 191px y la fila pedía 210 —cinco botones de 32, el contador y cinco separaciones—, así que el
 * «⋯» caía a un segundo renglón y la tarjeta dejaba de leerse como un renglón de lista. Con el
 * menú, la fila queda en tres controles y unos 130px: entra con holgura.
 *
 * Lo que se pierde está medido también: agotar cuesta ahora una pulsación más. Lo paga quien
 * administra una publicación —una persona por tarjeta—, y lo cobra quien sólo viene a mirar, que
 * son todas las demás.
 *
 * **El interruptor manual y el inventario no conviven**, igual que en la ficha: en cuanto un
 * producto lleva la cuenta, agotarlo es poner 0 y `is_available` se deriva de ahí. Dos mandos para
 * lo mismo podrían contradecirse —un producto marcado agotado a mano con 5 unidades guardadas no
 * sabría qué contestar—, y la regla se le pregunta a `carriesInventory`, el mismo sitio que decide
 * en `OwnerControls`.
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
   * El panel se cierra solo al confirmar, y no es cosmético: Radix abre en modo modal —deja el
   * resto de la página con `aria-hidden` y sin puntero—, así que un menú que sigue abierto después
   * de agotar tapa justo lo que se acaba de cambiar. Quien pulsa quiere ver la insignia de agotado
   * en su tarjeta, no el menú desde el que la pulsó.
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
      setIsOpen(false);
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

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      {/* `contents` no crea caja: el disparador es hijo directo de la fila de acciones y se reparte
          con el carrito y el apoyo, en vez de formar un grupo aparte. */}
      <span data-testid="card-owner-controls" className="contents">
        {/* Un `button` pelado vestido con `buttonVariants`, y no el componente `Button`.
            `asChild` de Radix clona al hijo y le pasa **su propia ref** para anclar el panel;
            `Button` es una función que no la reenvía, así que la ref se perdía y el menú no
            llegaba a abrirse — en el navegador, no en jsdom, que no necesita anclar nada. */}
        <DropdownMenu.Trigger
          type="button"
          aria-label={t("ownerMenu")}
          title={t("ownerMenu")}
          data-testid="card-owner-menu-trigger"
          className={buttonVariants({ size: "xs", iconOnly: true })}
        >
          <MdMoreHoriz size="20" aria-hidden />
        </DropdownMenu.Trigger>
      </span>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className={MENU_CONTENT_CLASS}
          data-testid="card-owner-menu"
          /* El campo de existencias vive dentro del panel, y Radix trata las letras y las flechas
             como navegación entre filas: sin esto no se podría teclear un número. Se filtra por el
             origen en vez de apagarlo entero, para que las teclas sigan moviendo el menú cuando el
             foco está en una fila. */
          onKeyDown={(event) => {
            if (event.target instanceof HTMLInputElement)
              event.stopPropagation();
          }}
        >
          <DropdownMenu.Item asChild>
            <Link
              href={{ pathname: "/editar/[slug]", params: { slug } }}
              data-testid="card-edit"
              className={`${MENU_ITEM_CLASS} flex items-center gap-2`}
            >
              <MdEdit aria-hidden />
              {t("edit")}
            </Link>
          </DropdownMenu.Item>

          {isSellable && !tracksInventory ? (
            /* `asChild` no sirve aquí: el hijo tiene que ser un `form`, y Radix cerraría el menú
               al pulsar antes de que la acción llegue a enviarse. Se queda como contenido normal
               del panel. */
            <form action={availabilityAction} className="mt-1">
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
                className="w-full justify-start"
                isLoading={isPending}
                disabled={!isHydrated || isPending}
                startIcon={
                  available ? (
                    <MdRemoveShoppingCart aria-hidden />
                  ) : (
                    <MdCheckCircle aria-hidden />
                  )
                }
              >
                {available ? t("markSoldOut") : t("markAvailable")}
              </Button>
            </form>
          ) : null}

          {state.errorMessage ? (
            <span
              data-testid="card-availability-error"
              className="mt-1 block px-3 text-sm text-brand-clay-700"
            >
              {state.errorMessage}
            </span>
          ) : null}

          {tracksStock ? (
            <>
              <span aria-hidden className={MENU_SEPARATOR_CLASS} />
              <span className="block px-1">
                <StockControl
                  action={setStock}
                  postId={postId}
                  slug={slug}
                  kind={kind}
                  stockQuantity={stockQuantity ?? null}
                  compact
                />
              </span>
            </>
          ) : null}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
