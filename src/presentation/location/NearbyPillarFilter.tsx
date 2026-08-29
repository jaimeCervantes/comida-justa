"use client";

import { useSearchParams } from "next/navigation";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  parsePublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { usePathname } from "~/i18n/navigation";
import PublicationPillarFilter from "~/presentation/post/PublicationPillarFilter";

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
 * roadmap habla de "cualquier ruta que lo entienda" — hoy son dos; el resto de rutas que hoy montan
 * `PublicationPillarFilter` a mano (categoría, directorio, perfil, tienda) se quedan como estaban,
 * para un slice posterior.
 *
 * **La forma la decide quien lo aloja, y por eso viaja como `className`.** Ver `IN_A_SINGLE_ROW`.
 */
const FILTERABLE_ROUTES = ["/", "/productos"] as const;

/**
 * Una fila que se desliza, no cinco filtros que se parten.
 *
 * Dentro de la barra los cinco son la pieza ancha (~620 px): partidos se llevaban dos y tres
 * renglones del chrome de **todas** las rutas, que es lo que el `@slice-5` vino a quitar. Aquí no
 * se parten —se arrastran—, y de `lg` hacia arriba caben en el mismo renglón que la ubicación. Las
 * otras cuatro rutas que montan `PublicationPillarFilter` van debajo de un título y con sitio de
 * sobra: por eso esto es una clase de **este** montaje y no un cambio del componente.
 *
 * `py-1` pisa el `pt-4` del componente y deja 4px arriba y abajo: `overflow-x` recorta también en
 * vertical, y sin ese margen el anillo de foco de un filtro se cortaría al tabular.
 */
const IN_A_SINGLE_ROW =
  "w-full min-w-0 shrink flex-nowrap overflow-x-auto no-scrollbar py-1 lg:w-auto";

export default function NearbyPillarFilter(): React.ReactNode {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!isFilterableRoute(pathname)) return null;

  const currentPillar = parsePublicationPillar(
    searchParams.get(PUBLICATION_PILLAR_QUERY_PARAM),
  );

  return (
    <PublicationPillarFilter
      currentPillar={currentPillar}
      pathname={pathname}
      className={IN_A_SINGLE_ROW}
    />
  );
}

function isFilterableRoute(
  pathname: string,
): pathname is (typeof FILTERABLE_ROUTES)[number] {
  return (FILTERABLE_ROUTES as readonly string[]).includes(pathname);
}
