"use client";

import { useSearchParams } from "next/navigation";
import { parseListingFilters } from "~/domain/entities/post/listingFilters";
import { usePathname } from "~/i18n/navigation";
import ListingFilterChips from "~/presentation/post/ListingFilters/ListingFilterChips";

/**
 * El filtro de pilares dentro de la barra de cercanía, del `@slice-4` de `chrome.feature`.
 *
 * **Cliente, y no una prop que baje desde el layout.** `NearbyBar` se monta una sola vez en
 * `RootLayout`, que no recibe `searchParams` —por diseño de Next.js: un layout es compartido por
 * rutas hermanas con parámetros distintos, así que no puede depender de ellos—. Leer la ruta y la
 * búsqueda con hooks de cliente es lo que le permite a la barra global saber en qué página está sin
 * que el layout tenga que enterarse.
 *
 * **Solo en las rutas de esta lista, y no en cualquiera.** El filtro construye enlaces que se
 * quedan en la misma página (`pathname` fijo); montarlo sin condición en el layout lo pondría
 * también en `/cuenta`, el detalle de una publicación o el carrito, rutas sin nada que filtrar. El
 * roadmap habla de "cualquier ruta que lo entienda" — hoy son dos; categoría, tienda, perfil y
 * búsqueda montan su propia `ListingFilterBar` bajo su título.
 *
 * **Monta los chips de la barra única** (`ListingFilterChips`), los mismos que categoría, tienda,
 * perfil y búsqueda pintan dentro de su tarjeta: pilar, «Solo con existencia» y «En promoción». Cada enlace parte
 * de **toda** la dirección, así que en `/productos` elegir un pilar ya no suelta `promocion`,
 * `marca` ni `tienda`, que es lo que pasaba cuando este filtro solo conocía `pillar` (slice 3 de
 * `docs/features/catalog/005-2026-11-10-filtros-del-catalogo.md`).
 */
const FILTERABLE_ROUTES = ["/", "/productos"] as const;

export default function NearbyPillarFilter(): React.ReactNode {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!isFilterableRoute(pathname)) return null;

  const query = Object.fromEntries(searchParams.entries());

  /* La forma de una sola fila la pone `ListingFilterChips`; el `overflow-x` vive en `NearbyBar`,
     sobre la fila completa, para que un solo gesto arrastre la barra entera. */
  return (
    <ListingFilterChips
      pathname={pathname}
      query={query}
      filters={parseListingFilters(query)}
    />
  );
}

function isFilterableRoute(
  pathname: string,
): pathname is (typeof FILTERABLE_ROUTES)[number] {
  return (FILTERABLE_ROUTES as readonly string[]).includes(pathname);
}
