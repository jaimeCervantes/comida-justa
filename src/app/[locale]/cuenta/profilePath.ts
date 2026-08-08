import { getPathname } from "~/i18n/navigation";
import { profileHref } from "~/i18n/routes";
import type { AppLocale } from "~/i18n/routing";

/**
 * La dirección pública de una persona.
 *
 * Vive bajo `/u/` por lo mismo que las tiendas bajo `/tienda/`: la raíz ya es de las
 * publicaciones. Al ser namespaces separados, una persona y una tienda pueden llamarse igual sin
 * taparse — `hazlosano.com/u/hazlo-sano` y `hazlosano.com/tienda/hazlo-sano` conviven.
 */
export const PROFILE_BASE_PATH = "/u";

/**
 * El destino tipado se mudó a `~/i18n/routes` junto con el de la tienda: `presentation/` también lo
 * necesita —una tarjeta enlaza a quien publica— y no puede importar de `app/`. Se reexporta desde
 * aquí para no tocar a quienes ya lo pedían a este módulo.
 */
export { profileHref } from "~/i18n/routes";

/**
 * La dirección tal como se ve. `/u/…` es igual en los dos idiomas —el identificador lo eligió la
 * persona y traducirlo no significa nada—, pero se resuelve por la misma vía que el resto para que
 * el día que cambie no haya que acordarse de este archivo.
 */
export function profilePath(username: string, locale: AppLocale): string {
  return getPathname({ href: profileHref(username), locale });
}
