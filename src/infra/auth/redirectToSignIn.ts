import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { getPathname } from "~/i18n/navigation";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { type AppLocale, resolveLocale } from "~/i18n/routing";
import { SIGNIN_PATH } from "~/infra/constants";
import { safeReturnPath } from "./returnPath";
import type { ReturnHref } from "./signInPath";

/**
 * Manda a entrar **diciendo a dónde volver**.
 *
 * Sustituye a `redirectKeepingLocale(SIGNIN_PATH, locale)` en las páginas privadas: aquella
 * conservaba el idioma pero no el destino, así que quien entraba desde `/pedidos` acababa en la
 * portada con el pedido sin ver. Devuelve `never` por el mismo motivo que
 * `redirectKeepingLocale`: quien llama no necesita un `return` detrás.
 */
export function redirectToSignIn(
  locale: AppLocale,
  returnTo: ReturnHref,
): never {
  return toSignIn(locale, getPathname({ locale, href: returnTo }));
}

/**
 * Igual, pero cuando el destino no se puede nombrar: el botón «Iniciar sesión» del encabezado está
 * en todas las páginas y no sabe en cuál.
 *
 * El origen sale del `Referer`, que en una acción de servidor es la dirección real del navegador
 * —con su prefijo de idioma y su query— y no hay que reconstruirla. Es lo mismo que hace el
 * `signIn()` de next-auth por dentro; la diferencia es que aquí la pantalla de acceso a la que se
 * llega es la del idioma activo, y no siempre la española.
 */
export async function redirectToSignInFromReferer(): Promise<never> {
  const locale = resolveLocale(await getLocale());

  return redirectToSignInFrom(locale, await refererPath());
}

/**
 * La misma vuelta, para los server actions que se encuentran sin sesión a medio formulario.
 *
 * Va **síncrona y `never` a propósito**, con el origen ya resuelto por quien llama, y no en una
 * versión `async` que lea el `Referer` por dentro: TypeScript no estrecha tipos después de un
 * `await` aunque su tipo sea `Promise<never>` —el mismo motivo que documenta
 * `redirectKeepingLocale`—, así que un `await redirectToSignInFrom(...)` obligaría a cada acción a
 * repetir `return` y `!` sobre el `userId` que acaba de comprobar.
 */
export function redirectToSignInFrom(
  locale: AppLocale,
  currentPath: string | null,
): never {
  return toSignIn(locale, currentPath);
}

/**
 * La página desde la que se envió el formulario.
 *
 * Un server action no sabe en qué página vive —`setAvailability` se dispara desde la ficha y desde
 * cualquier tarjeta de listado, y `advanceOrder` desde la lista y desde el detalle—, así que el
 * origen se lee del `Referer`, que en una petición del mismo sitio llega completo: con su prefijo
 * de idioma y su query. Sin `Referer` se devuelve `null` y la vuelta se queda en la portada, que es
 * lo que pasaba siempre antes de esto.
 */
export async function refererPath(): Promise<string | null> {
  const requestHeaders = await headers();

  return pathOfReferer(
    requestHeaders.get("referer"),
    requestHeaders.get("host"),
  );
}

function toSignIn(locale: AppLocale, candidate: string | null): never {
  const callbackUrl = safeReturnPath(candidate);

  return redirectKeepingLocale(
    callbackUrl
      ? { pathname: SIGNIN_PATH, query: { callbackUrl } }
      : SIGNIN_PATH,
    locale,
  );
}

/** La ruta del `Referer`, y solo si viene de este mismo sitio. */
function pathOfReferer(
  referer: string | null,
  host: string | null,
): string | null {
  if (!referer) return null;

  try {
    const url = new URL(referer);

    if (host && url.host !== host) return null;

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
