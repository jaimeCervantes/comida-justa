import { useTranslations } from "next-intl";
import { ONLY_AVAILABLE_QUERY_PARAM } from "~/domain/entities/post/catalogFilters";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import type { AppHref, AppPathname } from "~/i18n/navigation";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import PublicationPillarFilter from "~/presentation/post/PublicationPillarFilter";
import { listingQuery, type QueryValue } from "./listingQuery";
import ToggleFilterChip from "./ToggleFilterChip";

interface ListingFilterBarProps {
  pathname: AppPathname;
  params?: Record<string, string>;
  /**
   * Lo que la dirección lleva y la barra no controla —el término de la búsqueda, por ejemplo—.
   * Cada enlace lo conserva.
   */
  query?: Readonly<Record<string, QueryValue>>;
  currentPillar: PublicationPillar | null;
  onlyAvailable: boolean;
  /** Resultados por pilar, cuando se pueden afirmar. Ver `PublicationPillarFilter`. */
  counts?: Readonly<Record<string, number>> | null;
  /**
   * Prefijo de los `data-testid` de cada chip: `<prefijo>-pillar-<clave>` y
   * `<prefijo>-only-available`. La búsqueda pasa `facet`, que es el nombre que ya conocían sus
   * pruebas.
   */
  testIdPrefix?: string;
  testId?: string;
  /** El nombre del grupo para un lector de pantalla; por omisión, «Filtros». */
  ariaLabel?: string;
  /** El margen lo pone quien la monta: cada pantalla tiene su propio ritmo encima. */
  className?: string;
}

/**
 * Cinco filtros y un interruptor que no se parten: la fila entera se desliza.
 *
 * El `overflow-x` vive en la fila y no en cada mitad, para que un solo gesto arrastre todo —rótulos
 * incluidos— en vez de dejar el desplazamiento encerrado en la parte ancha.
 */
const IN_A_SINGLE_ROW = "shrink-0 flex-nowrap py-0";

/** El rótulo en versalitas: dice de qué va cada mitad sin gastar un renglón, y se calla donde el ancho es caro. */
const EYEBROW =
  "hidden shrink-0 text-label font-medium uppercase tracking-[0.14em] text-text-muted sm:inline";

/**
 * Los filtros de un listado: los mismos en todas las pantallas que enseñan publicaciones.
 *
 * Nació de tres copias que ya habían divergido: la búsqueda tenía «Solo con existencia» con
 * casilla, `/productos` tenía «En promoción» sin ella, y una categoría solo tenía pilares. Ver
 * `docs/features/catalog/005-2026-11-10-filtros-del-catalogo.md`.
 *
 * **Cambiar un filtro no suelta otro.** Cada enlace parte de la dirección completa (`listingQuery`)
 * y pisa solo lo suyo; la página vuelve a la 1, porque con otro filtro hay otra cuenta.
 *
 * **Arriba y no al lado**, desde el slice 1 de `listadosCompactos.feature`: como barra lateral
 * costaba 264 px de ancho y, en el teléfono, unos 360 px de alto antes del primer resultado.
 */
export default function ListingFilterBar({
  pathname,
  params,
  query,
  currentPillar,
  onlyAvailable,
  counts,
  testIdPrefix = "filter",
  testId = "listing-filters",
  ariaLabel,
  className,
}: ListingFilterBarProps): React.ReactElement {
  const t = useTranslations("listingFilters");
  const current = {
    ...query,
    [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar,
    [ONLY_AVAILABLE_QUERY_PARAM]: onlyAvailable ? "1" : undefined,
  };

  return (
    <aside
      aria-label={ariaLabel ?? t("label")}
      data-testid={testId}
      className={cn(
        "rounded-card border border-separator bg-surface-elevation-1",
        className,
      )}
    >
      {/* `py-2` no es solo aire: `overflow-x` recorta también en vertical, y esos 8px son los que
          dejan que el anillo de foco de un filtro se vea entero al tabular. */}
      <div className="no-scrollbar scroll-hint-x flex items-center gap-3 overflow-x-auto px-3 py-2">
        <span className={EYEBROW}>{t("pillar")}</span>

        <PublicationPillarFilter
          currentPillar={currentPillar}
          pathname={pathname}
          params={params}
          query={current}
          counts={counts}
          testIdPrefix={`${testIdPrefix}-pillar`}
          className={IN_A_SINGLE_ROW}
        />

        <span aria-hidden className="h-6 w-px shrink-0 bg-separator" />

        <span className={EYEBROW}>{t("availability")}</span>

        <ToggleFilterChip
          href={
            {
              pathname,
              params,
              query: listingQuery(current, {
                [ONLY_AVAILABLE_QUERY_PARAM]: onlyAvailable ? undefined : "1",
              }),
            } as AppHref
          }
          pressed={onlyAvailable}
          testId={`${testIdPrefix}-only-available`}
        >
          {t("onlyAvailable")}
        </ToggleFilterChip>
      </div>
    </aside>
  );
}
