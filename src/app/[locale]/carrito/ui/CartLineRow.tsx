"use client";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { MdDelete } from "react-icons/md";
import type { CartLine } from "~/domain/cart/cart";
import { MAX_QUANTITY } from "~/domain/cart/cartSelection";
import { Link } from "~/i18n/navigation";
import { SITE_CURRENCY } from "~/infra/constants";
import {
  type CartActionState,
  removeCartLine,
  setCartQuantity,
} from "~/presentation/cart/cartActions";
import { Button } from "~/presentation/design_system/buttons/Button";
import CurrencyAmount from "~/presentation/money/CurrencyAmount";

/**
 * Un renglón del carrito: qué es, cuántos, cuánto suma y cómo quitarlo.
 *
 * **Lo agotado se queda a la vista**, tachado y sin importe. Borrarlo solo sería más cómodo de
 * programar: quien lo puso ahí tiene derecho a enterarse de que ya no está y a decidir él.
 */
export default function CartLineRow({ line }: { line: CartLine }) {
  const t = useTranslations("cart");
  const [, quantityAction, isUpdating] = useActionState<
    CartActionState,
    FormData
  >(setCartQuantity, {});
  const [, removeAction, isRemoving] = useActionState<
    CartActionState,
    FormData
  >(removeCartLine, {});

  const { product, quantity, amount } = line;
  const soldOut = !product.isAvailable;

  return (
    <li
      data-testid="cart-line"
      data-post-id={product.postId}
      className="flex flex-wrap items-center gap-3 border-t border-separator py-3 first:border-t-0"
    >
      <div className="min-w-0 grow">
        <Link
          href={{ pathname: "/[slug]", params: { slug: product.slug } }}
          className={`font-medium hover:text-pw-lightgreen ${soldOut ? "line-through opacity-70" : ""}`}
        >
          {product.title}
        </Link>
        {soldOut ? (
          <p
            data-testid="cart-line-sold-out"
            className="text-label text-pw-orange"
          >
            {t("soldOutNote")}
          </p>
        ) : null}
      </div>

      <form action={quantityAction} className="flex items-center gap-2">
        <input type="hidden" name="postId" value={product.postId} />
        {/* Un `select` y no un campo numérico. Con `<input type="number">` la única forma de
            guardar sin un botón "actualizar" es enviar en cada pulsación, y entonces escribir "12"
            manda dos peticiones —una con el 1— y la primera puede llegar la última. Un desplegable
            emite un solo cambio por elección, y las cantidades de un carrito son pequeñas. */}
        <select
          name="quantity"
          defaultValue={quantity}
          aria-label={t("quantity", { product: product.title })}
          disabled={isUpdating || isRemoving}
          className="rounded-lg border border-separator bg-transparent px-2 py-1"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          {quantityOptions(quantity).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </form>

      <div className="w-24 text-right">
        {soldOut ? null : (
          <CurrencyAmount value={amount} currency={SITE_CURRENCY} />
        )}
      </div>

      <form action={removeAction}>
        <input type="hidden" name="postId" value={product.postId} />
        <Button
          type="submit"
          size="xs"
          aria-label={t("remove", { product: product.title })}
          data-testid="cart-remove"
          isLoading={isRemoving}
          disabled={isRemoving}
        >
          <MdDelete aria-hidden />
        </Button>
      </form>
    </li>
  );
}

/**
 * Las cantidades que ofrece el desplegable.
 *
 * Llega hasta `VISIBLE_QUANTITIES` porque un carrito de barrio no pide más — pero incluye la
 * cantidad actual aunque se salga de esa lista: una cookie puede traer 40, y un desplegable que no
 * contuviera su propio valor lo cambiaría solo al primer renderizado.
 */
function quantityOptions(current: number): number[] {
  const options = Array.from(
    { length: VISIBLE_QUANTITIES },
    (_, index) => index + 1,
  );

  return options.includes(current)
    ? options
    : [...options, Math.min(current, MAX_QUANTITY)];
}

const VISIBLE_QUANTITIES = 20;
