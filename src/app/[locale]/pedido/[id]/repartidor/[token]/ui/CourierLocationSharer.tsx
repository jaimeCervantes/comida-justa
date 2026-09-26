"use client";
import { useTranslations } from "next-intl";
import { Button } from "~/presentation/design_system/buttons/Button";
import { useShareCourierLocation } from "./useShareCourierLocation";

/**
 * El botón que arranca a compartir, y lo que pasa después de apretarlo.
 *
 * Cinco estados y no un booleano: "todavía no apreté", "mandando la primera", "confirmado", "el
 * navegador dijo que no" y "el pedido ya no acepta esto" son cinco situaciones distintas, y cada
 * una necesita su propio texto — nada de eso se resuelve con verdadero/falso.
 *
 * **`"active"` sólo se pinta cuando el servidor ya confirmó**, no en cuanto se aprieta el botón —
 * ver el docstring de `useShareCourierLocation` para el porqué.
 */
export default function CourierLocationSharer({
  orderId,
  token,
}: {
  orderId: string;
  token: string;
}) {
  const t = useTranslations("orders");
  const { state, start } = useShareCourierLocation(orderId, token);

  if (state === "denied") {
    return (
      <p data-testid="courier-share-denied" className="text-text-support">
        {t("courier.denied")}
      </p>
    );
  }

  if (state === "stopped") {
    return (
      <p data-testid="courier-share-stopped" className="text-text-support">
        {t("courier.stopped")}
      </p>
    );
  }

  if (state === "active") {
    return (
      <p
        data-testid="courier-share-active"
        className="font-medium text-pw-green"
      >
        {t("courier.active")}
      </p>
    );
  }

  return (
    <Button
      type="button"
      onClick={start}
      isLoading={state === "sending"}
      loadingLabel={t("courier.sending")}
      data-testid="courier-share-button"
    >
      {t("courier.share")}
    </Button>
  );
}
