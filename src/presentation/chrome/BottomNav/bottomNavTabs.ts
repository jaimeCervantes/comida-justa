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
  | "orders"
  | "account";

export interface BottomNavTab {
  id: BottomNavTabId;
  href: AppHref;
  /** La clave de `nav` con la que se rotula. Escrita entera: una clave armada no se puede grepear. */
  labelKey:
    | "bottomHome"
    | "bottomSearch"
    | "publish"
    | "bottomOrders"
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
  {
    id: "orders",
    href: "/pedidos",
    labelKey: "bottomOrders",
    pathnames: ["/pedidos", "/pedido/[id]"],
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
