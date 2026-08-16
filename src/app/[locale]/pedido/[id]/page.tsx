import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getFormatter,
  getLocale,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { canNotifySeller } from "~/domain/order/order";
import { Link } from "~/i18n/navigation";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale, routing } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { readCartSelection } from "~/infra/cart/readCart";
import { SIGNIN_PATH } from "~/infra/constants";
import { findSellerOfUser } from "~/infra/dataAccess/identity/sessionIdentity";
import { createOrderRepository } from "~/infra/dataAccess/orders/factory";
import { absoluteOrderUrl } from "~/infra/UI/mappers/absoluteOrderUrl";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import { Heading } from "~/presentation/design_system/typography/Heading";
import NotifySellerButton from "~/presentation/orders/NotifySellerButton/NotifySellerButton";
import OrderBuyer from "~/presentation/orders/OrderBuyer/OrderBuyer";
import OrderClosedOn from "~/presentation/orders/OrderClosedOn/OrderClosedOn";
import OrderHistory from "~/presentation/orders/OrderHistory/OrderHistory";
import OrderLines from "~/presentation/orders/OrderLines/OrderLines";
import OrderStatusBadge from "~/presentation/orders/OrderStatusBadge/OrderStatusBadge";
import CheckoutOrders from "./ui/CheckoutOrders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");

  return {
    title: t("title"),
    // Es de dos personas: no hay nada que indexar y la dirección no se reparte.
    robots: { index: false, follow: false },
  };
}

/**
 * Un pedido, para quien lo hizo y para quien lo recibe.
 *
 * **Solo esas dos personas.** Cualquier otra recibe 404 y no 403: un id de pedido es un uuid, y
 * responder «existe pero no es tuyo» convertiría la página en una forma de confirmar cuáles existen.
 *
 * Aquí es donde se avisa al vendedor por WhatsApp, y no en la acción que crea el pedido: un
 * `window.open` después de una acción de servidor llega sin gesto del usuario y los navegadores lo
 * bloquean. Un enlace normal sí se abre, y de paso el comprador se queda con una dirección a la que
 * volver.
 */
export default async function PedidoPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("orders");
  const format = await getFormatter();

  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) {
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
  }

  const repository = createOrderRepository();
  const order = await repository.findById(id, locale, routing.defaultLocale);

  if (!order) notFound();

  /* El recorrido se pide sólo aquí y sólo después de saber que el pedido existe: las listas traen
     diez por página, y meterlo en la consulta común habría sido leer diez recorridos para tirar
     nueve. */
  const history = await repository.historyOf(order.id);

  /* La tienda solo se consulta si hace falta: quien compró ya está autorizado por la primera mitad
     de la condición, y es el caso normal de esta página. */
  const isBuyer = order.buyerId === userId;
  const isSeller =
    !isBuyer && (await findSellerOfUser(userId))?.id === order.sellerId;

  if (!isBuyer && !isSeller) notFound();

  /* La compra completa y lo que queda en el carrito, **solo para quien compró**. Al vendedor no le
     incumbe a qué otras tiendas le pidieron en el mismo carrito, ni qué lleva ahora mismo. */
  const [siblings, pendingInCart] = isBuyer
    ? await Promise.all([
        repository.listByCheckout({
          checkoutId: order.checkoutId,
          buyerId: order.buyerId,
          locale,
          fallbackLocale: routing.defaultLocale,
        }),
        readCartSelection(),
      ])
    : [[], []];

  return (
    <main>
      <Heading level={1} className="mb-2">
        {isBuyer ? t("placed") : t("title")}
      </Heading>

      <p className="mb-6 flex flex-wrap items-center gap-3 text-text-support">
        <OrderStatusBadge status={order.status} />
        {/* `getFormatter` y no `toLocaleDateString(locale)`: el locale del routing es `es` a secas e
            `Intl` lo lee como español de España. Es el mismo tropiezo que ya arregló
            `CurrencyAmount`. */}
        <span data-testid="order-placed-on">
          {t("placedOn", {
            date: format.dateTime(order.createdAt, { dateStyle: "medium" }),
          })}
        </span>
        {/* Y cuándo se entregó o se canceló, si ya terminó. */}
        <OrderClosedOn order={order} />
      </p>

      <Surface
        as="section"
        radius="2xl"
        background="raised"
        border="subtle"
        elevation="sm"
        className="p-4"
        data-testid="order-detail"
      >
        <h2 className="mb-3 text-body-lg font-bold">{order.sellerName}</h2>

        {/* Sólo al vendedor: a quien compró, decirle que lo pidió él no le informa de nada. */}
        {isSeller ? (
          <div className="mb-3">
            <OrderBuyer
              name={order.buyerName}
              handle={order.buyerHandle}
              image={order.buyerImage}
            />
          </div>
        ) : null}

        <OrderLines lines={order.lines} />

        {/* Solo a quien compró se le pide que avise: el vendedor ya está del otro lado. Y solo
            mientras el pedido siga abierto — a un entregado no hay nada que avisarle, que es la
            misma regla que aplica la lista. */}
        {isBuyer && canNotifySeller(order.status) ? (
          <div className="mt-4 border-t border-separator pt-4">
            <p className="mb-3 text-text-support">{t("placedHint")}</p>
            <NotifySellerButton
              order={order}
              sellerPhone={order.sellerPhone}
              orderUrl={absoluteOrderUrl(locale, order.id)}
              labels={{
                intro: t("noticeIntro"),
                total: t("total"),
                cta: t("notifySeller", { store: order.sellerName }),
              }}
              testId="order-notify"
            />
          </div>
        ) : null}
      </Surface>

      <OrderHistory order={order} history={history} />

      {/* Un solo pedido no es "una compra de varios": no hay nada que juntar y el bloque sobraría. */}
      {siblings.length > 1 ? (
        <CheckoutOrders
          orders={siblings}
          currentId={order.id}
          locale={locale}
        />
      ) : null}

      {/* Lo que quedó en el carrito. Confirmar es por tienda, así que la segunda mitad de una compra
          se queda esperando ahí — y sin decirlo, depende de que el comprador se acuerde de volver. */}
      {pendingInCart.length > 0 ? (
        <p className="mt-6 text-text-support" data-testid="order-cart-pending">
          {t("cartPending")}{" "}
          <Link href="/carrito" className="font-medium text-pw-green underline">
            {t("cartPendingCta")}
          </Link>
        </p>
      ) : null}
    </main>
  );
}
