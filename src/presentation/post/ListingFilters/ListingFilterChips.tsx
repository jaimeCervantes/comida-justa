import { useTranslations } from "next-intl";
import { ONLY_AVAILABLE_QUERY_PARAM } from "~/domain/entities/post/catalogFilters";
import {
  type ListingFilterState,
  listingFilterParams,
} from "~/domain/entities/post/listingFilters";
import { ON_SALE_QUERY_PARAM } from "~/domain/entities/post/promotion";
import type { AppHref, AppPathname } from "~/i18n/navigation";
import PublicationPillarFilter from "~/presentation/post/PublicationPillarFilter";
import { listingQuery, type QueryValue } from "./listingQuery";
import ToggleFilterChip from "./ToggleFilterChip";

export interface ListingFilterChipsProps {
  pathname: AppPathname;
  params?: Record<string, string>;
  /**
   * Lo que la dirección lleva y la barra no controla —el término de la búsqueda, `promocion`,
   * `marca`…—. Cada enlace lo conserva.
   */
  query?: Readonly<Record<string, QueryValue>>;
  /** Pilar, «Solo con existencia» y «En promoción», como los leyó `parseListingFilters`. */
  filters: ListingFilterState;
  /** Resultados por pilar, cuando se pueden afirmar. Ver `PublicationPillarFilter`. */
  counts?: Readonly<Record<string, number>> | null;
  /**
   * Prefijo de los `data-testid` de cada chip: `<prefijo>-pillar-<clave>`,
   * `<prefijo>-only-available` y `<prefijo>-on-sale`. La búsqueda pasa `facet`, que es el nombre que ya conocían sus
   * pruebas.
   */
  testIdPrefix?: string;
}

/**
 * Cinco filtros y dos interruptores que no se parten: la fila entera se desliza.
 *
 * El `overflow-x` no vive aquí sino en quien aloja la fila, para que un solo gesto arrastre todo
 * —rótulos incluidos— en vez de dejar el desplazamiento encerrado en la parte ancha.
 */
const IN_A_SINGLE_ROW = "shrink-0 flex-nowrap py-0";

/** El rótulo en versalitas de los pilares: dice de qué van sin gastar un renglón, y se calla donde el ancho es caro. */
const EYEBROW =
  "hidden shrink-0 text-label font-medium uppercase tracking-[0.14em] text-text-muted sm:inline";

/**
 * Los chips de los filtros de un listado, sin superficie: pilares, separador e interruptores.
 *
 * Es la pieza que comparten `ListingFilterBar` —que la envuelve en su tarjeta, debajo del título de
 * cada pantalla— y la barra de cercanía del chrome, que la monta en su propia fila en `/` y
 * `/productos`. Ver `docs/features/catalog/005-2026-11-10-filtros-del-catalogo.md`.
 *
 * **Cambiar un filtro no suelta otro.** Cada enlace parte de la dirección completa (`listingQuery`)
 * y pisa solo lo suyo; la página vuelve a la 1, porque con otro filtro hay otra cuenta.
 */
export default function ListingFilterChips({
  pathname,
  params,
  query,
  filters,
  counts,
  testIdPrefix = "filter",
}: ListingFilterChipsProps): React.ReactElement {
  const t = useTranslations("listingFilters");
  const { currentPillar, onlyAvailable, onSale } = filters;
  const current = { ...query, ...listingFilterParams(filters) };
  /** El mismo listado con un interruptor volteado y todo lo demás como estaba. */
  const toggled = (param: string, on: boolean): AppHref =>
    ({
      pathname,
      params,
      query: listingQuery(current, { [param]: on ? undefined : "1" }),
    }) as AppHref;

  return (
    <>
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

      {/* Sin rótulo del lado de los interruptores: «Solo con existencia» y «En promoción» ya dicen
          lo que hacen, y el separador basta para leer dónde acaban los pilares. */}
      <span aria-hidden className="h-6 w-px shrink-0 bg-separator" />

      <ToggleFilterChip
        href={toggled(ONLY_AVAILABLE_QUERY_PARAM, onlyAvailable)}
        pressed={onlyAvailable}
        testId={`${testIdPrefix}-only-available`}
      >
        {t("onlyAvailable")}
      </ToggleFilterChip>

      <ToggleFilterChip
        href={toggled(ON_SALE_QUERY_PARAM, onSale)}
        pressed={onSale}
        testId={`${testIdPrefix}-on-sale`}
      >
        {t("onSale")}
      </ToggleFilterChip>
    </>
  );
}
