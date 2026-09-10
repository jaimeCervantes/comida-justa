import { getTranslations } from "next-intl/server";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { type AppHref, Link } from "~/i18n/navigation";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import PublicationPillarFilter, {
  FILTER_CHIP,
} from "~/presentation/post/PublicationPillarFilter";

export const ONLY_AVAILABLE_PARAM = "disponibles";

interface FacetsProps {
  query: string;
  currentPillar: PublicationPillar | null;
  onlyAvailable: boolean;
  /** Resultados por categoría raíz, o `null` cuando no se pueden afirmar. */
  counts: Readonly<Record<string, number>> | null;
}

/**
 * Cinco filtros y un interruptor que no se parten: la fila entera se desliza.
 *
 * Es el mismo trato que `NearbyPillarFilter` le da a la barra de cercanía, y por el mismo motivo:
 * partidos se llevaban tres renglones justo encima de lo que se vino a leer. El `overflow-x` vive
 * en la fila y no en cada mitad, para que un solo gesto arrastre todo —rótulos incluidos— en vez de
 * dejar el desplazamiento encerrado en la parte ancha.
 */
const IN_A_SINGLE_ROW = "shrink-0 flex-nowrap py-0";

/** El rótulo en versalitas: dice de qué va cada mitad sin gastar un renglón, y se calla donde el ancho es caro. */
const EYEBROW =
  "hidden shrink-0 text-label font-medium uppercase tracking-[0.14em] text-text-muted sm:inline";

/** La misma búsqueda con la disponibilidad cambiada. La página vuelve siempre a la 1: el orden cambió. */
function hrefWithAvailability(
  query: string,
  pillar: PublicationPillar | null,
  onlyAvailable: boolean,
): AppHref {
  const params: Record<string, string> = { q: query };

  if (pillar) params[PUBLICATION_PILLAR_QUERY_PARAM] = pillar;
  if (onlyAvailable) params[ONLY_AVAILABLE_PARAM] = "1";

  return { pathname: "/buscar", query: params } as AppHref;
}

/**
 * Las facetas de la búsqueda: por qué pilar y si queda existencia.
 *
 * Es la pantalla 5.7 del canvas, con dos ausencias deliberadas y una tercera medida:
 *
 * - **No hay deslizador de distancia.** El repositorio de búsqueda lo tiene escrito: «no hay filtro
 *   por radio en ninguna parte: esconder algo que alguien pidió por su nombre sería el peor fallo
 *   posible». La distancia desempata el orden; no recorta la lista.
 * - **No hay «envase retornable».** No existe esa columna, y fingirla desde la interfaz sería
 *   inventar un modelo de datos.
 * - **Los números aparecen solo cuando se pueden afirmar.** Salen de contar el mismo texto que
 *   filtró la búsqueda; si respondió el rescate semántico, contar palabras describiría otra cosa.
 *
 * **Se cuenta sin el filtro de pilar puesto**, que es lo que hace de esto una faceta y no un
 * marcador: con el filtro aplicado los otros tres saldrían en cero y no habría por dónde volver.
 *
 * **Arriba y no al lado, desde el slice 1 de `listadosCompactos.feature`.** Como barra lateral
 * costaba 264 px del ancho —dejaba los resultados en 952 y las tarjetas en 306— y, en el teléfono,
 * unos 360 px de alto que había que recorrer antes de ver el primer resultado. En una fila cuesta
 * un renglón en las dos pantallas, y los resultados quedan con los mismos 1216 px que el resto del
 * sitio.
 *
 * **Los pilares los pinta `PublicationPillarFilter`**, que es el mismo control que ya usan el home,
 * la barra de cercanía, categoría, tienda y perfil. Escribir aquí una segunda fila de chips habría
 * sido copiar cinco colores, un contador y un estado activo para que divergieran a la primera; lo
 * que esta pantalla añade —las cuentas por pilar— viaja como prop.
 */
export default async function SearchFacets({
  query,
  currentPillar,
  onlyAvailable,
  counts,
}: FacetsProps): Promise<React.ReactElement> {
  const t = await getTranslations("search");

  return (
    <aside
      aria-label={t("facetsLabel")}
      data-testid="search-facets"
      className="rounded-card border border-separator bg-surface-elevation-1"
    >
      {/* `py-2` no es solo aire: `overflow-x` recorta también en vertical, y esos 8px son los que
          dejan que el anillo de foco de un filtro se vea entero al tabular. */}
      <div className="no-scrollbar scroll-hint-x flex items-center gap-3 overflow-x-auto px-3 py-2">
        <span className={EYEBROW}>{t("facetPillar")}</span>

        <PublicationPillarFilter
          currentPillar={currentPillar}
          pathname="/buscar"
          query={{
            q: query,
            [ONLY_AVAILABLE_PARAM]: onlyAvailable ? "1" : undefined,
          }}
          counts={counts}
          testIdPrefix="facet-pillar"
          className={IN_A_SINGLE_ROW}
        />

        <span aria-hidden className="h-6 w-px shrink-0 bg-separator" />

        <span className={EYEBROW}>{t("facetAvailability")}</span>

        {/* Un enlace y no una casilla: la búsqueda entera vive en la dirección, así que este filtro
            se comparte, se guarda y vuelve con el botón de atrás como cualquier otro. Una casilla
            controlada por JavaScript no haría ninguna de las tres. */}
        <Link
          href={hrefWithAvailability(query, currentPillar, !onlyAvailable)}
          aria-pressed={onlyAvailable}
          data-testid="facet-only-available"
          className={cn(
            FILTER_CHIP,
            "gap-2",
            onlyAvailable
              ? "border-pw-green bg-pw-green text-white"
              : "border-separator bg-surface-elevation-1 text-text-base hover:bg-surface-elevation-2",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "grid size-4 shrink-0 place-items-center rounded-chip border",
              onlyAvailable
                ? "border-white bg-white/20 text-white"
                : "border-border-field",
            )}
          >
            {onlyAvailable ? "✓" : null}
          </span>
          {t("facetOnlyAvailable")}
        </Link>
      </div>
    </aside>
  );
}
