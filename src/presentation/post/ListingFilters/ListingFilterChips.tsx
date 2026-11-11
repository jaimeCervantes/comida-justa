import { useTranslations } from "next-intl";
import { ONLY_AVAILABLE_QUERY_PARAM } from "~/domain/entities/post/catalogFilters";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
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
}

/**
 * Cinco filtros y un interruptor que no se parten: la fila entera se desliza.
 *
 * El `overflow-x` no vive aquí sino en quien aloja la fila, para que un solo gesto arrastre todo
 * —rótulos incluidos— en vez de dejar el desplazamiento encerrado en la parte ancha.
 */
const IN_A_SINGLE_ROW = "shrink-0 flex-nowrap py-0";

/** El rótulo en versalitas: dice de qué va cada mitad sin gastar un renglón, y se calla donde el ancho es caro. */
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
  currentPillar,
  onlyAvailable,
  counts,
  testIdPrefix = "filter",
}: ListingFilterChipsProps): React.ReactElement {
  const t = useTranslations("listingFilters");
  const current = {
    ...query,
    [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar,
    [ONLY_AVAILABLE_QUERY_PARAM]: onlyAvailable ? "1" : undefined,
  };

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
    </>
  );
}
