"use client";
import { useTranslations } from "next-intl";
import { profileHref } from "~/i18n/routes";
import IdentityLink from "~/presentation/identity/IdentityLink";
import Avatar from "~/presentation/user/Avatar";

/**
 * Quién hizo el pedido, para quien lo tiene que preparar.
 *
 * **No es un componente nuevo, es una composición**: la cara y el nombre enlazados a un perfil ya
 * los resuelve `IdentityLink` desde la ficha, la tienda y el directorio. Escribir aquí otro par
 * `Avatar` + `Link` habría sido la quinta copia del mismo patrón.
 *
 * **Sin `username` no hay enlace, pero sí nombre.** El perfil vive en `/u/<username>` y sólo lo
 * tiene quien lo eligió —hoy 1 de 21 cuentas—, así que enlazar a ciegas mandaría a un 404 a la
 * mayoría. Y sin nombre siquiera, se dice "lo pidió alguien": que el pedido tiene dueño es
 * información, aunque no se pueda nombrar.
 */
export default function OrderBuyer({
  name,
  handle,
  image,
}: {
  name: string | null;
  handle: string | null;
  image: string | null;
}) {
  const t = useTranslations("orders");
  const label = t("buyer", { name: name ?? handle ?? t("buyerUnknown") });
  /* Decorativo: el nombre va escrito al lado, así que un `alt` lo haría decir dos veces —la misma
     regla que `Thumbnail` en los renglones. */
  const face = (
    <span aria-hidden="true">
      <Avatar user={{ name, image }} size="sm" />
    </span>
  );

  if (!handle) {
    return (
      <span
        data-testid="order-buyer"
        className="flex min-w-0 items-center gap-2 font-medium"
      >
        {face}
        <span className="min-w-0 truncate">{label}</span>
      </span>
    );
  }

  return (
    <IdentityLink
      href={profileHref(handle)}
      label={label}
      media={face}
      testId="order-buyer"
      className="min-w-0 font-medium"
    />
  );
}
