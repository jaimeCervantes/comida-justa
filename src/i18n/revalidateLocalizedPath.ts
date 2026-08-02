import { revalidatePath } from "next/cache";
import { getPathname } from "./navigation";
import { routing } from "./routing";

type LocalizedHref = Parameters<typeof getPathname>[0]["href"];

/**
 * Invalida la caché de una ruta **en todos los idiomas**.
 *
 * Desde que hay rutas localizadas, un mismo recurso vive en dos direcciones: `/cuenta` y
 * `/en/account`. `revalidatePath("/cuenta")` solo tira la española, así que quien estuviera
 * navegando en inglés seguiría viendo la versión vieja — un fallo silencioso y difícil de
 * reproducir, porque en español todo parece correcto.
 *
 * Recibe el `href` interno (la clave de `pathnames`, con sus `params` si la ruta los lleva) y
 * resuelve por sí misma la dirección de cada idioma.
 */
export function revalidateLocalizedPath(href: LocalizedHref): void {
  for (const locale of routing.locales) {
    revalidatePath(getPathname({ href, locale }));
  }
}
