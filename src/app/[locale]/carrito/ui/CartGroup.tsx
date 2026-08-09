import { getTranslations } from "next-intl/server";
import type { CartSellerGroup } from "~/domain/cart/cart";
import { buildWhatsappCartLink } from "~/domain/order/whatsappCartOrder";
import { Link } from "~/i18n/navigation";
import { SITE_CURRENCY } from "~/infra/constants";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import CurrencyAmount from "~/presentation/money/CurrencyAmount";
import WhatsappButton from "~/presentation/post/WhatsappButton/WhatsappButton";
import CartLineRow from "./CartLineRow";

/**
 * El pedido de **una** tienda: sus renglones, su total y su botón para confirmarlo.
 *
 * Cada tienda tiene el suyo porque cada una acepta, prepara y entrega por su cuenta — y porque no se
 * le puede mandar un WhatsApp a dos vendedores a la vez. Con un solo vendedor en la base se ve un
 * bloque; el día que haya dos, se ven dos, sin que esta pantalla cambie.
 */
export default async function CartGroup({
  group,
  baseUrl,
}: {
  group: CartSellerGroup;
  /** La raíz pública **con el idioma ya puesto**: es lo que se le manda al vendedor. */
  baseUrl: string;
}) {
  const t = await getTranslations("cart");

  const orderLink = buildWhatsappCartLink(group, baseUrl, {
    intro: t("orderIntro"),
    total: t("orderTotal"),
  });

  return (
    <Surface
      as="section"
      radius="2xl"
      background="raised"
      border="subtle"
      elevation="sm"
      className="p-4"
      data-testid="cart-group"
      data-seller={group.seller.handle ?? group.seller.id}
    >
      <h2 className="text-body-lg font-bold">
        {group.seller.handle ? (
          <Link
            href={{
              pathname: "/tienda/[slug]",
              params: { slug: group.seller.handle },
            }}
            className="hover:text-pw-lightgreen"
          >
            {group.seller.name}
          </Link>
        ) : (
          group.seller.name
        )}
      </h2>

      <ul className="mt-2">
        {group.lines.map((line) => (
          <CartLineRow key={line.product.postId} line={line} />
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-separator pt-4">
        <p className="text-body-lg">
          <span className="mr-2 font-medium">{t("total")}</span>
          <span data-testid="cart-group-total">
            <CurrencyAmount value={group.subtotal} currency={SITE_CURRENCY} />
          </span>
        </p>

        {/* Sin nada disponible no hay pedido que mandar: `buildWhatsappCartLink` devuelve `null` y
            `WhatsappButton` no pinta nada, así que en su lugar se explica por qué. */}
        {orderLink ? (
          <WhatsappButton href={orderLink} testId="cart-confirm">
            {t("confirmWith", { store: group.seller.name })}
          </WhatsappButton>
        ) : (
          <p
            data-testid="cart-group-unavailable"
            className="text-label text-text-support"
          >
            {t("nothingAvailable")}
          </p>
        )}
      </div>
    </Surface>
  );
}
