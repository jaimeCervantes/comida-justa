"use client";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { MdAddShoppingCart } from "react-icons/md";
import { canBeOrdered } from "~/domain/entities/post/availability";
import { Button } from "~/presentation/design_system/buttons/Button";
import { addToCart, type CartActionState } from "../cartActions";

/**
 * Junta un producto para pedirlo con los demás.
 *
 * **No se pinta si no se puede pedir**, y la regla es la misma que apaga el botón de WhatsApp
 * (`canBeOrdered`): un anuncio no se vende y lo agotado no se puede entregar. Vive en un solo sitio
 * para que la ficha y la tarjeta no puedan discrepar.
 */
export default function AddToCartButton({
  postId,
  kind,
  isAvailable,
  size = "sm",
  className,
}: {
  postId: string;
  kind?: string | null;
  isAvailable?: boolean | null;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const t = useTranslations("cart");
  const [, action, isPending] = useActionState<CartActionState, FormData>(
    addToCart,
    {},
  );

  if (!canBeOrdered({ kind, isAvailable })) return null;

  return (
    <form action={action} className={className}>
      <input type="hidden" name="postId" value={postId} />
      <Button
        type="submit"
        size={size}
        color="green"
        startIcon={<MdAddShoppingCart />}
        isLoading={isPending}
        disabled={isPending}
        data-testid="add-to-cart"
      >
        {t("add")}
      </Button>
    </form>
  );
}
