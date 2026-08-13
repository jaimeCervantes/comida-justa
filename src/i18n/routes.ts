import type { CuratedChallengeSlug } from "~/domain/habits/curatedChallenges";
import type { AppHref } from "./navigation";

/**
 * Los destinos tipados de una tienda y de una persona.
 *
 * Vivían en `app/[locale]/cuenta/`, que servía mientras solo los usaran las rutas. Desde que una
 * tarjeta de listado enlaza a la tienda de su publicación hacen falta también en `presentation/`, y
 * un componente de `presentation/` **no puede importar de `app/`** (misma regla que documenta
 * `StoreSummaryCard`). Copiar el literal `"/tienda/[slug]"` en el otro lado era garantizar que el
 * día que la ruta cambie uno de los dos se quede atrás, así que viven aquí, junto al resto de la
 * navegación, y `cuenta/storePath.ts` y `cuenta/profilePath.ts` los reexportan.
 *
 * Son objetos de ruta, no cadenas: el `Link` de `~/i18n/navigation` los traduce al idioma activo
 * (`/tienda/…` en español, `/store/…` en inglés).
 */

/** El destino tipado de una tienda, para un `<Link>` o un `router.push`. */
export function storeHref(handle: string) {
  return { pathname: "/tienda/[slug]", params: { slug: handle } } as const;
}

/** El destino tipado de una persona. */
export function profileHref(username: string) {
  return { pathname: "/u/[username]", params: { username } } as const;
}

/**
 * La portada de los cuatro pilares: el mismo catch-all, sin segmento.
 *
 * Vivía en `presentation/chrome/Header/menuItems.ts`, que bastaba mientras el menú fuera el único
 * que llevaba ahí. Desde que el inicio también invita a practicar habría dos copias del literal, y
 * eso es garantizar que el día que la ruta cambie una de las dos se quede atrás. `menuItems.ts` la
 * reexporta para que el menú siga importándola de donde siempre.
 */
export const PILLARS_OVERVIEW_HREF = {
  pathname: "/pilares/[[...slug]]",
  params: { slug: [] },
} as const satisfies AppHref;

/** El destino tipado de un pilar; el slug estable no se traduce. */
export function pillarHref(slug: CuratedChallengeSlug): {
  pathname: "/pilares/[[...slug]]";
  params: { slug: CuratedChallengeSlug[] };
} {
  return {
    pathname: "/pilares/[[...slug]]",
    params: { slug: [slug] },
  };
}
