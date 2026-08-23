import { routing } from "~/i18n/routing";
import { SIGNIN_PATH } from "~/infra/constants";

/**
 * Origen de mentira para poder resolver rutas relativas con `URL`. No se usa para comparar contra
 * el sitio real: a esta función solo le llegan rutas internas, y lo que se compara es que sigan
 * siéndolo después de resolverlas.
 */
const RELATIVE_ORIGIN = "https://ruta.interna.invalid";

/**
 * La ruta a la que volver tras entrar, o `null` cuando no se puede confiar en ella.
 *
 * Filtra dos cosas distintas, y las dos importan:
 *
 * 1. **Que sea de este sitio.** Un `callbackUrl` viaja en la query, o sea que lo escribe quien
 *    quiera: sin este filtro, un enlace preparado convierte la pantalla de acceso en un trampolín
 *    hacia otro dominio con la marca de este por delante. `//otro-sitio.com` y `/\otro-sitio.com`
 *    empiezan por `/` pero el navegador los lee como direcciones absolutas, así que se descartan
 *    antes de resolver nada.
 * 2. **Que no sea la propia pantalla de acceso.** Es el bucle que dejaba a todo el mundo en la
 *    portada: next-auth usa por omisión la dirección actual como destino, y la dirección actual
 *    *es* la pantalla de acceso.
 */
export function safeReturnPath(
  candidate: string | null | undefined,
): string | null {
  if (!candidate?.startsWith("/")) return null;
  if (candidate[1] === "/" || candidate[1] === "\\") return null;

  let target: URL;
  try {
    target = new URL(candidate, RELATIVE_ORIGIN);
  } catch {
    return null;
  }

  if (target.origin !== RELATIVE_ORIGIN) return null;
  if (isSignInPath(target.pathname)) return null;

  return `${target.pathname}${target.search}${target.hash}`;
}

/**
 * La misma regla para lo que recibe el callback `redirect` de NextAuth, que puede llegar absoluto
 * («https://este-sitio.com/pedidos») o relativo, y que tiene que devolverse absoluto.
 */
export function safeReturnUrl(
  candidate: string,
  baseUrl: string,
): string | null {
  let target: URL;
  try {
    target = new URL(candidate, baseUrl);
  } catch {
    return null;
  }

  if (target.origin !== new URL(baseUrl).origin) return null;

  const path = safeReturnPath(
    `${target.pathname}${target.search}${target.hash}`,
  );

  return path === null ? null : new URL(path, baseUrl).toString();
}

/**
 * `/auth/signin` es igual en los dos idiomas —lo dicta NextAuth, no `routing.pathnames`—, pero sí
 * lleva prefijo: desde el inglés es `/en/auth/signin`. Se compara sin él para que la puerta se
 * reconozca en cualquier idioma.
 */
function isSignInPath(pathname: string): boolean {
  const path = stripLocalePrefix(pathname);

  return path === SIGNIN_PATH || path.startsWith(`${SIGNIN_PATH}/`);
}

function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`))
      return pathname.slice(1 + locale.length);
  }

  return pathname;
}
