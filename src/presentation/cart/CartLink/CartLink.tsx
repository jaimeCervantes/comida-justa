import { getTranslations } from "next-intl/server";
import { MdShoppingCart } from "react-icons/md";
import { countSelectionItems } from "~/domain/cart/cartSelection";
import { Link } from "~/i18n/navigation";
import { readCartSelection } from "~/infra/cart/readCart";

/**
 * El carrito en la cabecera, con lo que lleva.
 *
 * **Cuenta desde la cookie, sin consultar la base.** Se pinta en todas las pantallas del sitio y no
 * puede costar una consulta por página. El precio de eso es que cuenta también lo que se agotó desde
 * que se añadió; el carrito, que sí lee la base, es el que lo aclara.
 *
 * Se enseña siempre, incluso vacío: es la única puerta al carrito y esconderla obliga a recordar la
 * dirección.
 */
export default async function CartLink() {
  const t = await getTranslations("cart");
  const count = countSelectionItems(await readCartSelection());

  return (
    <Link
      href="/carrito"
      data-testid="cart-link"
      aria-label={t("itemCount", { count })}
      className="focus-ring relative inline-flex items-center rounded-control p-2 text-text-base transition-colors hover:text-pw-green"
    >
      <MdShoppingCart size="24" aria-hidden />
      {count > 0 ? (
        <span
          data-testid="cart-count"
          className="absolute -right-1 -top-1 min-w-5 rounded-full bg-pw-orange px-1 text-center text-xs font-bold leading-5 text-white"
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
