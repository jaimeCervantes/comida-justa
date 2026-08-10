"use client";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "~/presentation/design_system/buttons/Button";
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

  return (
    <form action={action}>
      <input type="hidden" name="sellerId" value={sellerId} />
      <Button
        type="submit"
        color="green"
        startIcon={<FaWhatsapp />}
        isLoading={isPending}
        disabled={isPending}
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
