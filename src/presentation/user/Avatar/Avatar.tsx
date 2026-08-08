"use client";
import * as AvatarR from "@radix-ui/react-avatar";
import type { User } from "next-auth";
import { useTranslations } from "next-intl";
import { useInitials } from "./hooks";

/**
 * `sm` existe para cuando el avatar acompaña a un nombre escrito dentro de una línea de texto —los
 * enlaces de identidad de una publicación—, donde 45 px parten el renglón. `md` es el de siempre y
 * sigue siendo el predeterminado, para no mover el header, las tarjetas ni los comentarios.
 */
const SIZES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-[45px] w-[45px] text-[15px]",
} as const;

export default function Avatar({
  user,
  size = "md",
}: {
  user?: User;
  size?: keyof typeof SIZES;
}) {
  const initials = useInitials(user?.name);
  const t = useTranslations("common");

  return (
    <AvatarR.Root
      className={`bg-blackA1 inline-flex ${SIZES[size]} select-none items-center justify-center overflow-hidden rounded-full align-middle`}
    >
      <AvatarR.Image
        className="h-full w-full rounded-[inherit] object-cover"
        src={user?.image ?? undefined}
        alt={user?.name ?? t("avatarAlt")}
      />
      <AvatarR.Fallback
        // Sin tamaño de texto propio: lo hereda de la raíz, que es quien conoce el tamaño pedido.
        className="text-violet11 leading-1 flex h-full w-full items-center justify-center bg-white font-medium"
        delayMs={600}
      >
        {initials}
      </AvatarR.Fallback>
    </AvatarR.Root>
  );
}
