import type { AppHref } from "~/i18n/navigation";

/**
 * Las cinco pestañas de la barra inferior, y cuándo se marca cada una.
 *
 * Está aparte del componente por lo mismo que `menuItems.ts`: **qué ruta pertenece a qué pestaña es
 * una regla, no una decisión de pintado**, y una regla se puede probar sin navegador. La barra de
 * escritorio ya aprendió esta lección — dos listas de rutas, una en el `.feature` y otra en el spec,
 * son las que dejaron al home sin su control de ubicación sin que nada fallara.
 *
 * **Se compara contra la plantilla interna**, la que devuelve `usePathname` de `~/i18n/navigation`:
 * `/categoria/[key]` tanto para `/categoria/jugos` como para `/en/category/jugos`. La regla se
 * escribe una vez y vale en los dos idiomas.
 */
export type BottomNavTabId =
  | "home"
  | "search"
  | "publish"
  | "products"
  | "account";

export interface BottomNavTab {
  id: BottomNavTabId;
  href: AppHref;
  /** La clave de `nav` con la que se rotula. Escrita entera: una clave armada no se puede grepear. */
  labelKey:
    | "bottomHome"
    | "bottomSearch"
    | "publish"
    | "bottomProducts"
    | "bottomAccount";
  /**
   * Las rutas internas que marcan esta pestaña.
   *
   * Solo entran destinos a los que la pestaña **lleva de verdad**, o que son la misma sección
   * paginada. Una ficha de publicación (`/[slug]`) no marca nada: se llega desde cualquier parte, y
   * decir «estás en Inicio» mientras alguien mira un producto sería mentir sobre dónde está.
   */
  pathnames: readonly string[];
}

export const BOTTOM_NAV_TABS: readonly BottomNavTab[] = [
  {
    id: "home",
    href: "/",
    labelKey: "bottomHome",
    pathnames: ["/", "/page/[page]"],
  },
  {
    id: "search",
    href: "/buscar",
    labelKey: "bottomSearch",
    pathnames: ["/buscar"],
  },
  {
    id: "publish",
    href: "/publicar",
    labelKey: "publish",
    pathnames: ["/publicar"],
  },
  /*
   * El catálogo, y no «Pedidos», y esa es la decisión de esta pestaña.
   *
   * Medido en un teléfono: en el home había **un solo** enlace visible a `/productos`, en el pie, a
   * 6.670 px de scroll. El CTA «Ver lo que hay hoy» que lleva ahí existe en el DOM pero está
   * oculto —la portada es `hidden lg:block`—, así que el catálogo se alcanzaba por hamburguesa →
   * Comunidad → Productos, o bajando hasta el final.
   *
   * Mientras tanto, dos de las cinco pestañas —«Pedidos» y «Yo»— **son un muro de acceso** para
   * quien no ha entrado: las dos redirigen a identificarse. En un sitio cuya puerta es mirar lo que
   * hay, la barra del pulgar estaba dando dos de sus cinco plazas a algo que la mayoría no puede
   * usar todavía, y ninguna a lo que vino a ver.
   *
   * «Pedidos» no se queda sin camino: lo llevan el menú del avatar y `AccountNav` —o sea, la
   * pestaña «Yo» de aquí al lado—. `/productos` no tenía ninguno.
   */
  {
    id: "products",
    href: "/productos",
    labelKey: "bottomProducts",
    pathnames: ["/productos", "/productos/page/[page]"],
  },
  {
    id: "account",
    href: "/cuenta",
    labelKey: "bottomAccount",
    pathnames: ["/cuenta", "/cuenta/agenda"],
  },
] as const;

/** Qué pestaña está activa en esta ruta, o `null` si ninguna. */
export function activeBottomNavTab(pathname: string): BottomNavTabId | null {
  return (
    BOTTOM_NAV_TABS.find((tab) => tab.pathnames.includes(pathname))?.id ?? null
  );
}
