import { getTranslations } from "next-intl/server";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { type AppHref, Link } from "~/i18n/navigation";
import { Alert } from "~/presentation/design_system/feedback/Alert";
import { ONLY_AVAILABLE_PARAM } from "./SearchFacets";

interface SummaryProps {
  query: string;
  total: number;
  currentPillar: PublicationPillar | null;
  onlyAvailable: boolean;
  /** `true` cuando respondió el rescate semántico y no la coincidencia de palabras. */
  isSemantic: boolean;
}

function hrefWith(
  query: string,
  pillar: PublicationPillar | null,
  onlyAvailable: boolean,
): AppHref {
  const params: Record<string, string> = { q: query };

  if (pillar) params[PUBLICATION_PILLAR_QUERY_PARAM] = pillar;
  if (onlyAvailable) params[ONLY_AVAILABLE_PARAM] = "1";

  return { pathname: "/buscar", query: params } as AppHref;
}

const CHIP =
  "focus-ring inline-flex items-center gap-1.5 rounded-full border border-separator bg-surface-elevation-1 px-3 py-1 text-label text-text-base transition-colors hover:bg-surface-elevation-2";

/**
 * Cuántos resultados hay y con qué filtros puestos, con la salida de cada uno.
 *
 * Es la fila del 5.7 que va antes de todo: *«18 resultados · 2 Alimentación ✕ · Limpiar todo»*.
 * Sin ella, quien filtra por pilar y luego no encuentra nada no tiene forma de saber **por qué** —
 * los filtros estaban en la barra de arriba, y desde el fondo de una lista vacía no se ven.
 *
 * **Cada chip es un enlace que quita su propio filtro.** Un filtro que se pone con un clic y se
 * quita buscando dónde se puso no es un filtro, es una trampa.
 *
 * El aviso semántico se pinta cuando respondió el rescate: los resultados se parecen al **sentido**
 * de lo escrito y no a sus palabras, y decirlo evita que se lean como coincidencias exactas.
 */
export default async function SearchSummary({
  query,
  total,
  currentPillar,
  onlyAvailable,
  isSemantic,
}: SummaryProps): Promise<React.ReactElement> {
  const t = await getTranslations("search");
  const pillarT = await getTranslations("publicationPillars");
  const hasFilters = currentPillar !== null || onlyAvailable;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span data-testid="search-summary" className="text-body font-semibold">
          {t("resultsSummary", { count: total })}
        </span>

        {currentPillar ? (
          <Link
            href={hrefWith(query, null, onlyAvailable)}
            data-testid="chip-pillar"
            className={CHIP}
          >
            {pillarT(currentPillar)}
            <span aria-hidden>✕</span>
          </Link>
        ) : null}

        {onlyAvailable ? (
          <Link
            href={hrefWith(query, currentPillar, false)}
            data-testid="chip-available"
            className={CHIP}
          >
            {t("filterAvailable")}
            <span aria-hidden>✕</span>
          </Link>
        ) : null}

        {hasFilters ? (
          <Link
            href={hrefWith(query, null, false)}
            data-testid="chip-clear"
            className="focus-ring rounded-chip px-2 py-1 text-label font-semibold text-highlight underline underline-offset-4"
          >
            {t("clearFilters")}
          </Link>
        ) : null}
      </div>

      {isSemantic ? (
        <Alert
          tone="info"
          label={t("semanticNote")}
          data-testid="search-semantic-note"
        />
      ) : null}
    </div>
  );
}
