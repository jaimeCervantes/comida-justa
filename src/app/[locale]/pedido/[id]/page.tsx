import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getFormatter,
  getLocale,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { buildWhatsappOrderNoticeLink } from "~/domain/order/whatsappOrderNotice";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import {
  type AppLocale,
  pathnames,
  resolveLocale,
  routing,
} from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { PUBLIC_BASE_URL, SIGNIN_PATH } from "~/infra/constants";
import { findSellerOfUser } from "~/infra/dataAccess/identity/sessionIdentity";
import { createOrderRepository } from "~/infra/dataAccess/orders/factory";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import { Heading } from "~/presentation/design_system/typography/Heading";
import OrderBuyer from "~/presentation/orders/OrderBuyer/OrderBuyer";
import OrderLines from "~/presentation/orders/OrderLines/OrderLines";
import OrderStatusBadge from "~/presentation/orders/OrderStatusBadge/OrderStatusBadge";
import WhatsappButton from "~/presentation/post/WhatsappButton/WhatsappButton";

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

  const order = await createOrderRepository().findById(
    id,
    locale,
    routing.defaultLocale,
  );

  if (!order) notFound();

  /* La tienda solo se consulta si hace falta: quien compró ya está autorizado por la primera mitad
     de la condición, y es el caso normal de esta página. */
  const isBuyer = order.buyerId === userId;
  const isSeller =
    !isBuyer && (await findSellerOfUser(userId))?.id === order.sellerId;

  if (!isBuyer && !isSeller) notFound();

  const orderUrl = absoluteOrderUrl(locale, order.id);
  const noticeLink = buildWhatsappOrderNoticeLink(
    order,
    order.sellerPhone,
    orderUrl,
    { intro: t("placedHint"), total: t("total") },
  );

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

        {/* Solo a quien compró se le pide que avise: el vendedor ya está del otro lado. */}
        {isBuyer ? (
          <div className="mt-4 border-t border-separator pt-4">
            <p className="mb-3 text-text-support">{t("placedHint")}</p>
            <WhatsappButton href={noticeLink} testId="order-notify">
              {t("notifySeller", { store: order.sellerName })}
            </WhatsappButton>
          </div>
        ) : null}
      </Surface>
    </main>
  );
}

/**
 * La dirección absoluta del pedido, en el idioma en que se hizo.
 *
 * Sale de `pathnames` y no de una plantilla escrita aquí: la ruta **está traducida**
 * (`/pedido/[id]` y `/order/[id]`), así que un `${base}/pedido/${id}` mandaría al vendedor inglés a
 * una dirección que no existe. Y `localePrefix` es `as-needed`, así que el prefijo solo lo lleva el
 * inglés.
 */
function absoluteOrderUrl(locale: AppLocale, id: string): string {
  const path = pathnames["/pedido/[id]"][locale].replace("[id]", id);
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  return `${PUBLIC_BASE_URL}${prefix}${path}`;
}
