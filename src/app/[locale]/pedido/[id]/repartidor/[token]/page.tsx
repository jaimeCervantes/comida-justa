import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isTrackable } from "~/domain/order/order";
import { resolveLocale } from "~/i18n/routing";
import { createOrderRepository } from "~/infra/dataAccess/orders/factory";
import { Heading } from "~/presentation/design_system/typography/Heading";
import CourierLocationSharer from "./ui/CourierLocationSharer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");

  return {
    title: t("courier.heading"),
    // Es una credencial disfrazada de dirección: no hay nada que indexar.
    robots: { index: false, follow: false },
  };
}

/**
 * A dónde llega el repartidor cuando el vendedor le manda el enlace.
 *
 * **Sin sesión, a propósito.** El repartidor de esta etapa es ocasional —ver
 * `docs/features/commerce/028-2026-09-18-pedido-enviado.md`—, y pedirle cuenta para mandar una
 * coordenada mata la función antes de empezar. Quien abre este enlace se autentica con el
 * `token`, no con una cookie.
 *
 * **Ni siquiera confirma que el pedido existe si el token no coincide** — `findByCourierToken` lo
 * decide así, la misma cautela que la ficha del pedido tiene con un id ajeno.
 */
export default async function CourierTrackingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; token: string }>;
}) {
  const { locale: rawLocale, id, token } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("orders");

  const repository = createOrderRepository();
  const order = await repository.findByCourierToken(id, token);

  if (!order) notFound();

  return (
    <main className="mx-auto max-w-md" data-testid="courier-tracking-page">
      <Heading level={1} className="mb-2">
        {t("courier.heading")}
      </Heading>
      <p className="mb-6 text-text-support">{t("courier.intro")}</p>

      {isTrackable(order.status) ? (
        <CourierLocationSharer orderId={id} token={token} />
      ) : (
        <p data-testid="courier-tracking-stopped" className="text-text-support">
          {t("courier.stopped")}
        </p>
      )}
    </main>
  );
}
