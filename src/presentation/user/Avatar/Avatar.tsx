"use client";
import * as AvatarR from "@radix-ui/react-avatar";
import type { User } from "next-auth";
import { useTranslations } from "next-intl";
import { largeGoogleAvatarUrl } from "~/domain/entities/user/avatarUrl";
import { useInitials } from "./hooks";

/**
 * Google recorta su avatar a 96px por omisión. En `sm`/`md` eso alcanza de sobra, pero `cover`
 * puede medir varios cientos de píxeles de lado en escritorio, y 96px estirados se ven borrosos.
 */
const COVER_SOURCE_SIZE = 480;

/**
 * `sm` existe para cuando el avatar acompaña a un nombre escrito dentro de una línea de texto —los
 * enlaces de identidad de una publicación—, donde 45 px parten el renglón. `md` es el de siempre y
 * sigue siendo el predeterminado, para no mover el header, las tarjetas ni los comentarios.
 *
 * `cover` es distinto de los otros dos: no es una burbuja de identidad de tamaño fijo, es una foto
 * que ocupa **todo** el contenedor que la aloja —la mitad de `PracticeCover`—, sin redondear
 * esquinas. El tamaño lo decide quien lo usa dándole alto y ancho al contenedor, no este componente.
 */
const SIZES = {
  sm: "h-7 w-7 rounded-full text-[11px]",
  md: "h-[45px] w-[45px] rounded-full text-[15px]",
  cover: "h-full w-full rounded-none text-2xl",
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
  const src =
    size === "cover"
      ? largeGoogleAvatarUrl(user?.image, COVER_SOURCE_SIZE)
      : user?.image;

  return (
    <AvatarR.Root
      className={`bg-blackA1 inline-flex ${SIZES[size]} select-none items-center justify-center overflow-hidden align-middle`}
    >
      <AvatarR.Image
        className="h-full w-full rounded-[inherit] object-cover"
        src={src ?? undefined}
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
