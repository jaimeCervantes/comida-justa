import { createNavigation } from "next-intl/navigation";
import type { ComponentProps } from "react";
import { routing } from "./routing";

// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

/**
 * Lo que acepta un `href` desde que `routing.ts` declara `pathnames`: una ruta declarada, o el par
 * `{ pathname, params }` cuando lleva segmentos dinámicos. Ya **no** vale un `string` cualquiera,
 * y ese es justo el beneficio: un enlace a una ruta que no existe deja de ser un 404 que se
 * descubre navegando y pasa a ser un fallo de `pnpm typecheck`.
 *
 * Se exporta porque varios componentes reciben el destino como prop (`Pagination`, `LinkButton`,
 * `ListItem`…), y escribir `string` en esa prop volvería a apagar la comprobación en cuanto el
 * enlace cruza un componente.
 */
export type AppHref = ComponentProps<typeof Link>["href"];

/**
 * Lo mismo, pero para `redirect` y `router.push`. **No es el mismo tipo que el de `Link`**: la
 * forma con objeto de `Link` acepta todo lo de `UrlObject` (`hash`, `search`…) y esta solo `query`,
 * así que uno no encaja en el otro aunque se parezcan. Se deriva de la propia función para no
 * repetirlo a mano.
 */
export type AppRedirectHref = Parameters<typeof redirect>[0]["href"];

/** Solo el nombre de la ruta, sin la forma con parámetros. */
export type AppPathname = keyof typeof routing.pathnames;

/**
 * Las rutas que paginan, que por convención terminan en `/page/[page]`. Tipar así a `Pagination`
 * impide pasarle una ruta que no pagina: el error sale al compilar, no al pulsar "Siguiente".
 */
export type PaginatedPathname = Extract<AppPathname, `${string}/page/[page]`>;
