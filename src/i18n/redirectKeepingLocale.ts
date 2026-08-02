import { type AppRedirectHref, redirect } from "./navigation";
import type { AppLocale } from "./routing";

/**
 * Redirige conservando el idioma activo.
 *
 * Existe por dos razones, y las dos importan:
 *
 * 1. El `redirect` de `next/navigation` manda a la ruta tal cual, así que desde `/en/cuenta` un
 *    `redirect("/auth/signin")` deja al visitante en español sin avisar. El de next-intl sí
 *    prefija el idioma.
 * 2. next-intl lo tipa como `void`, no como `never`. Con ese tipo, TypeScript deja de entender que
 *    después de un `redirect` no se sigue ejecutando, y cada `if (!session) redirect(...)` obliga a
 *    repetir `return` y `!` en quien llama. El `throw` de abajo devuelve ese estrechamiento:
 *    `redirect` **siempre** lanza, porque por dentro llama al de Next.
 *
 * El idioma se recibe como parámetro y no se resuelve aquí con `getLocale()` **a propósito**: eso
 * obligaría a que la función fuera `async`, y TypeScript no estrecha tipos después de un `await`
 * aunque su tipo sea `Promise<never>`. Quien llama ya tiene el idioma, o lo pide con `getLocale()`.
 */
export function redirectKeepingLocale(
  href: AppRedirectHref,
  locale: AppLocale,
): never {
  redirect({ href, locale });

  throw new Error(
    `redirect a ${JSON.stringify(href)} no interrumpió la ejecución`,
  );
}
