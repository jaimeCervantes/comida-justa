"use client";
import { useTranslations } from "next-intl";
import {
  type FormEvent,
  startTransition,
  useActionState,
  useState,
} from "react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "~/presentation/design_system/buttons/Button";
import { readGrantedPosition } from "~/presentation/location/readGrantedPosition";
import {
  type PlaceOrderState,
  placeOrder,
} from "~/presentation/orders/orderActions";

/**
 * Confirma el pedido de **una** tienda.
 *
 * Antes esto era un enlace directo a `wa.me`. Ahora primero se registra el pedido y después se
 * avisa, desde su propia página: si el aviso fuera lo primero, un pedido existiría solo dentro de una
 * conversación de WhatsApp y nadie podría decir cuántos hubo ni en qué acabaron.
 *
 * El icono de WhatsApp se queda **a propósito**, aunque este botón ya no abra WhatsApp: es lo que
 * sigue pasando dos segundos después, y quitarlo haría dudar de a dónde lleva.
 *
 * **En el mismo clic viaja, si se puede, a dónde se entrega.** Solo si el navegador ya tiene
 * permiso y contesta en un plazo corto (`readGrantedPosition`): no se añade un paso ni un diálogo
 * de permiso a la compra. Si no contesta, el pedido sale igual, sin destino, y se puede compartir
 * después desde su ficha.
 */
export default function ConfirmOrderButton({
  sellerId,
  sellerName,
}: {
  sellerId: string;
  sellerName: string;
}) {
  const t = useTranslations("orders");
  const [state, action, isPending] = useActionState<PlaceOrderState, FormData>(
    placeOrder,
    {},
  );
  const [isLocating, setIsLocating] = useState(false);
  const isBusy = isLocating || isPending;

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setIsLocating(true);
    const destination = await readGrantedPosition();
    setIsLocating(false);

    if (destination) {
      data.set("deliveryLat", String(destination.lat));
      data.set("deliveryLng", String(destination.lng));
    }

    startTransition(() => action(data));
  };

  return (
    <form action={action} onSubmit={submit}>
      <input type="hidden" name="sellerId" value={sellerId} />
      <Button
        type="submit"
        color="green"
        startIcon={<FaWhatsapp />}
        isLoading={isBusy}
        disabled={isBusy}
        data-testid="cart-confirm"
      >
        {t("confirm", { store: sellerName })}
      </Button>

      {state.error ? (
        <p
          data-testid="cart-confirm-error"
          className="mt-2 text-label text-pw-orange"
        >
          {state.error === "nothing-available"
            ? t("errorUnavailable")
            : t("errorEmpty")}
        </p>
      ) : null}
    </form>
  );
}
