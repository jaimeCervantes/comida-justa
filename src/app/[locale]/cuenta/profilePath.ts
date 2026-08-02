import { getPathname } from "~/i18n/navigation";
import type { AppLocale } from "~/i18n/routing";

/**
 * La dirección pública de una persona.
 *
 * Vive bajo `/u/` por lo mismo que las tiendas bajo `/tienda/`: la raíz ya es de las
 * publicaciones. Al ser namespaces separados, una persona y una tienda pueden llamarse igual sin
 * taparse — `hazlosano.com/u/hazlo-sano` y `hazlosano.com/tienda/hazlo-sano` conviven.
 */
export const PROFILE_BASE_PATH = "/u";

/** El destino tipado, para un `<Link>` o un `router.push`. */
export function profileHref(username: string) {
  return { pathname: "/u/[username]", params: { username } } as const;
}

/**
 * La dirección tal como se ve. `/u/…` es igual en los dos idiomas —el identificador lo eligió la
 * persona y traducirlo no significa nada—, pero se resuelve por la misma vía que el resto para que
 * el día que cambie no haya que acordarse de este archivo.
 */
export function profilePath(username: string, locale: AppLocale): string {
  return getPathname({ href: profileHref(username), locale });
}
