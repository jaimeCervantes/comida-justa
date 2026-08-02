import type { Metadata } from "next";
import { buildLocalizedAlternates } from "~/domain/seo/alternates";
import { getPathname } from "~/i18n/navigation";
import { routing } from "~/i18n/routing";
import { CANONICAL_URL } from "~/infra/constants";

/** El destino tal y como lo acepta `getPathname`: una ruta declarada, con sus parámetros si lleva. */
export type AlternateHref = Parameters<typeof getPathname>[0]["href"];

/**
 * El canónico y los `hreflang` de una página que existe en los dos idiomas.
 *
 * La dirección de cada idioma la resuelve `getPathname` a partir de `pathnames`, nunca se concatena
 * a mano: `/nosotros` es `/en/about` en inglés, y el día que un segmento cambie de nombre estas
 * etiquetas cambian con él en vez de quedarse apuntando a un 404.
 */
export function localizedAlternates(
  href: AlternateHref,
  locale: string,
): Metadata["alternates"] {
  const pathByLocale = Object.fromEntries(
    routing.locales.map((code) => [code, getPathname({ href, locale: code })]),
  );

  return buildLocalizedAlternates({
    baseUrl: CANONICAL_URL,
    pathByLocale,
    locale,
    defaultLocale: routing.defaultLocale,
  });
}
