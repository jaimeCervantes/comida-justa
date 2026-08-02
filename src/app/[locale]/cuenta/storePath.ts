import { getPathname } from "~/i18n/navigation";
import type { AppLocale } from "~/i18n/routing";

/**
 * La dirección pública de una tienda.
 *
 * Vive con prefijo `/tienda/` y no en la raíz porque la raíz ya es de las publicaciones
 * (`src/app/[locale]/[slug]`): con `localePrefix: "as-needed"`, `hazlosano.com/jugo-verde` es el
 * detalle de un producto. Separando los namespaces, una tienda y una publicación pueden llamarse
 * igual sin taparse.
 */
export const STORE_BASE_PATH = "/tienda";

/** El destino tipado, para un `<Link>` o un `router.push`. */
export function storeHref(handle: string) {
  return { pathname: "/tienda/[slug]", params: { slug: handle } } as const;
}

/**
 * La dirección **tal como se ve** en ese idioma: `/tienda/…` en español y `/store/…` en inglés.
 *
 * Necesita el idioma desde que existen rutas localizadas. Antes bastaba con concatenar, pero esa
 * cadena era la que el vendedor copia para compartir su tienda: sin traducirla, quien navegue en
 * inglés copiaría una dirección que ya no resuelve.
 */
export function storePath(handle: string, locale: AppLocale): string {
  return getPathname({ href: storeHref(handle), locale });
}
