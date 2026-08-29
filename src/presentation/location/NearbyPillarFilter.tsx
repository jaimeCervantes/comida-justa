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
 * Cinco filtros que no se parten, porque la barra entera es un renglón que se desliza.
 *
 * Dentro de la barra los cinco son la pieza ancha (~620 px): partidos se llevaban dos y tres
 * renglones del chrome de **todas** las rutas, que es lo que el `@slice-5` vino a quitar. Las otras
 * cuatro rutas que montan `PublicationPillarFilter` van debajo de un título y con sitio de sobra:
 * por eso esto es una clase de **este** montaje y no un cambio del componente.
 *
 * **El `overflow-x` no está aquí, y es a propósito.** Vive en `NearbyBar`, sobre la fila completa,
 * para que un solo gesto arrastre la barra entera —rótulo, ubicación y filtros— en vez de dejar el
 * scroll encerrado en la mitad ancha. Aquí solo queda no partirse (`flex-nowrap`), no comprimirse
 * (`shrink-0`) y ceder el relleno vertical (`py-0`) a quien ahora manda: la fila que lo contiene.
 */
const IN_A_SINGLE_ROW = "shrink-0 flex-nowrap py-0";

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
