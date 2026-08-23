import { getPathname } from "~/i18n/navigation";
import type { AppLocale } from "~/i18n/routing";
import { SIGNIN_PATH } from "~/infra/constants";

/**
 * El destino al que volver tras entrar, tipado igual que cualquier otro enlace: `"/pedidos"` o
 * `{ pathname: "/[slug]", params: { slug } }`. Se deriva de `getPathname` para que una ruta que no
 * existe siga siendo un fallo de `pnpm typecheck` y no un 404 que se descubre navegando.
 */
export type ReturnHref = Parameters<typeof getPathname>[0]["href"];

/**
 * La dirección de la pantalla de acceso con el regreso escrito dentro.
 *
 * **El idioma viaja dentro de las dos rutas, no aparte.** `getPathname` prefija el inglés
 * (`/en/auth/signin`, `/en/orders`) y deja el español desnudo, que es justo el contrato de
 * `localePrefix: "as-needed"`. Sin el prefijo en el regreso, entrar desde una ficha en inglés
 * devolvía a una dirección que en español no resuelve: los dos idiomas tienen slug propio.
 *
 * Existe para que las cuatro pantallas que ofrecen entrar (seguir, asistir, celebrar, practicar)
 * no repitan la concatenación; el día que la pantalla de acceso cambie de sitio, cambia aquí.
 */
export function signInPathFor(locale: AppLocale, returnTo: ReturnHref): string {
  const callbackUrl = getPathname({ locale, href: returnTo });
  const signInPath = getPathname({ locale, href: SIGNIN_PATH });

  return `${signInPath}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
