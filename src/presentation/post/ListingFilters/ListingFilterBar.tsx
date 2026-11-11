import { useTranslations } from "next-intl";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import ListingFilterChips, {
  type ListingFilterChipsProps,
} from "./ListingFilterChips";

interface ListingFilterBarProps extends ListingFilterChipsProps {
  testId?: string;
  /** El nombre del grupo para un lector de pantalla; por omisión, «Filtros». */
  ariaLabel?: string;
  /** El margen lo pone quien la monta: cada pantalla tiene su propio ritmo encima. */
  className?: string;
}

/**
 * Los filtros de un listado: los mismos en todas las pantallas que enseñan publicaciones.
 *
 * Nació de tres copias que ya habían divergido: la búsqueda tenía «Solo con existencia» con
 * casilla, `/productos` tenía «En promoción» sin ella, y una categoría solo tenía pilares. Ver
 * `docs/features/catalog/005-2026-11-10-filtros-del-catalogo.md`. Los chips son
 * `ListingFilterChips`; esto es su superficie, para las pantallas que la montan bajo su título.
 *
 * **Arriba y no al lado**, desde el slice 1 de `listadosCompactos.feature`: como barra lateral
 * costaba 264 px de ancho y, en el teléfono, unos 360 px de alto antes del primer resultado.
 */
export default function ListingFilterBar({
  testId = "listing-filters",
  ariaLabel,
  className,
  ...chips
}: ListingFilterBarProps): React.ReactElement {
  const t = useTranslations("listingFilters");

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
        <ListingFilterChips {...chips} />
      </div>
    </aside>
  );
}
