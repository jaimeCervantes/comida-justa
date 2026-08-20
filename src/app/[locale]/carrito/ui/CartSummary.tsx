import { getTranslations } from "next-intl/server";
import { type CartSellerGroup, cartTotal } from "~/domain/cart/cart";
import { SITE_CURRENCY } from "~/infra/constants";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import CurrencyAmount from "~/presentation/money/CurrencyAmount";

/**
 * Lo que va a costar la compra entera.
 *
 * **Solo aparece con dos tiendas o más**: con una sola sería la misma cifra dos veces seguidas, y un
 * número repetido hace dudar de si son el mismo o hay algo que no se entendió.
 *
 * No es un importe cobrable —cada tienda cobra el suyo, y por eso los subtotales siguen mandando— y
 * la nota lo dice sin rodeos: esto se confirma en un pedido por tienda. Se enseña igual porque la
 * pregunta de quien llena un carrito no es "¿cuánto le debo a cada uno?" sino "¿cuánto me voy a
 * gastar?", y hasta ahora había que sumarlo de cabeza.
 */
export default async function CartSummary({
  groups,
}: {
  groups: CartSellerGroup[];
}) {
  const t = await getTranslations("cart");

  return (
    <Surface
      as="section"
      radius="card"
      background="raised"
      border="subtle"
      elevation="sm"
      className="p-4"
      data-testid="cart-summary"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body-lg font-bold">{t("grandTotal")}</p>
        <span data-testid="cart-grand-total" className="text-body-lg">
          <CurrencyAmount value={cartTotal(groups)} currency={SITE_CURRENCY} />
        </span>
      </div>

      <p className="mt-2 text-label text-text-support">
        {t("grandTotalNote", { count: groups.length })}
      </p>
    </Surface>
  );
}
