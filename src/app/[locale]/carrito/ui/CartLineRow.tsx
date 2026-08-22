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
import Thumbnail from "~/presentation/media/Thumbnail/Thumbnail";
import CurrencyAmount from "~/presentation/money/CurrencyAmount";

const STEP_BUTTON =
  "focus-ring px-3 py-1 text-body-lg leading-none text-text-base transition-colors hover:bg-surface-elevation-2 disabled:opacity-40 disabled:pointer-events-none";

/**
 * Un renglón del carrito: qué es, cuántos, cuánto suma y cómo quitarlo.
 *
 * **Lo agotado se queda a la vista**, tachado y sin importe. Borrarlo solo sería más cómodo de
 * programar: quien lo puso ahí tiene derecho a enterarse de que ya no está y a decidir él.
 *
 * La foto y el nombre llevan al producto. Son **dos enlaces al mismo sitio**, así que el de la foto
 * va oculto para lectores de pantalla y fuera del recorrido del tabulador: repetir el destino no
 * informa, y una imagen decorativa dentro de un enlace se anunciaría como "enlace" a secas.
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
  const busy = isUpdating || isRemoving;
  const href = { pathname: "/[slug]" as const, params: { slug: product.slug } };

  return (
    <li
      data-testid="cart-line"
      data-post-id={product.postId}
      className="flex gap-3 border-t border-separator py-3 first:border-t-0"
    >
      <Link href={href} aria-hidden tabIndex={-1} className="shrink-0">
        <Thumbnail
          url={product.imageUrl}
          size={64}
          className={soldOut ? "opacity-50" : undefined}
          testId="cart-line-image"
        />
      </Link>

      {/* Todo lo demás en columna: en un teléfono el nombre se lleva su renglón entero y los
          controles caen debajo, en vez de comprimirse hasta ser impulsables. */}
      <div className="flex min-w-0 grow flex-col gap-2">
        <Link
          href={href}
          data-testid="cart-line-link"
          className={`font-medium hover:text-highlight ${soldOut ? "line-through opacity-70" : ""}`}
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

        <div className="flex flex-wrap items-center gap-3">
          <QuantityStepper
            action={quantityAction}
            postId={product.postId}
            title={product.title}
            quantity={quantity}
            disabled={busy}
          />

          {/* `ml-auto` empuja el importe al extremo cuando caben en una línea, y lo deja en su sitio
              cuando la fila se parte. */}
          <span className="ml-auto">
            {soldOut ? null : (
              <CurrencyAmount value={amount} currency={SITE_CURRENCY} />
            )}
          </span>

          <form action={removeAction}>
            <input type="hidden" name="postId" value={product.postId} />
            <Button
              type="submit"
              size="xs"
              aria-label={t("remove", { product: product.title })}
              data-testid="cart-remove"
              isLoading={isRemoving}
              disabled={busy}
            >
              <MdDelete aria-hidden />
            </Button>
          </form>
        </div>
      </div>
    </li>
  );
}

/**
 * Menos, la cantidad, y más.
 *
 * Sustituye a un `<select>` de veinte opciones, que era correcto y se usaba fatal: para poner tres
 * había que abrir una lista y buscar el número. Aquí lo normal —sumar o restar uno— es un toque.
 *
 * **Los botones mandan un incremento (`delta`), no la cantidad final.** El servidor lo aplica sobre
 * lo que hay en la cookie en ese momento, así que dos toques rápidos suman dos aunque la pantalla
 * todavía enseñe el número viejo. Mandar "3" desde una pantalla que se quedó atrás pisaría el otro
 * toque.
 *
 * El campo sigue siendo un `number` para poder escribir 12 sin doce toques, y **envía al salir**, no
 * en cada tecla: enviar por tecla manda una petición por dígito y la del "1" puede llegar después de
 * la del "12".
 */
function QuantityStepper({
  action,
  postId,
  title,
  quantity,
  disabled,
}: {
  action: (formData: FormData) => void;
  postId: string;
  title: string;
  quantity: number;
  disabled: boolean;
}) {
  const t = useTranslations("cart");

  return (
    <form
      action={action}
      className="flex items-center overflow-hidden rounded-control border border-separator"
    >
      <input type="hidden" name="postId" value={postId} />

      <button
        type="submit"
        name="delta"
        value="-1"
        aria-label={t("decrease", { product: title })}
        data-testid="cart-decrease"
        disabled={disabled || quantity <= 1}
        className={STEP_BUTTON}
      >
        −
      </button>

      {/* `key` con la cantidad: tras escribir un valor y guardarlo, el campo tiene que volver a
          nacer con lo que dice el servidor. Sin ella conservaría lo tecleado aunque el servidor lo
          hubiera recortado al tope. */}
      <input
        key={quantity}
        type="number"
        name="quantity"
        defaultValue={quantity}
        min={1}
        max={MAX_QUANTITY}
        inputMode="numeric"
        aria-label={t("quantity", { product: title })}
        data-testid="cart-quantity"
        disabled={disabled}
        className="w-14 border-x border-separator bg-transparent py-1 text-center"
        onBlur={(event) => {
          if (Number(event.currentTarget.value) !== quantity) {
            event.currentTarget.form?.requestSubmit();
          }
        }}
      />

      <button
        type="submit"
        name="delta"
        value="1"
        aria-label={t("increase", { product: title })}
        data-testid="cart-increase"
        disabled={disabled || quantity >= MAX_QUANTITY}
        className={STEP_BUTTON}
      >
        +
      </button>
    </form>
  );
}
