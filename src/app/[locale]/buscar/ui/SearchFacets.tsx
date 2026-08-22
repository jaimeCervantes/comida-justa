import { getTranslations } from "next-intl/server";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  PUBLICATION_PILLARS,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { type AppHref, Link } from "~/i18n/navigation";
import { BadgeCounter } from "~/presentation/design_system/badges/Badge";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import { Heading } from "~/presentation/design_system/typography/Heading";

export const ONLY_AVAILABLE_PARAM = "disponibles";

interface FacetsProps {
  query: string;
  currentPillar: PublicationPillar | null;
  onlyAvailable: boolean;
  /** Resultados por categoría raíz, o `null` cuando no se pueden afirmar. */
  counts: Readonly<Record<string, number>> | null;
}

/** La misma búsqueda con un filtro cambiado. La página vuelve siempre a la 1: el orden cambió. */
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
 */
export default async function SearchFacets({
  query,
  currentPillar,
  onlyAvailable,
  counts,
}: FacetsProps): Promise<React.ReactElement> {
  const t = await getTranslations("search");
  const pillarT = await getTranslations("publicationPillars");

  return (
    <aside
      aria-label={t("facetsLabel")}
      data-testid="search-facets"
      className="rounded-card border border-separator bg-surface-elevation-1 p-5"
    >
      <Heading
        level={2}
        size="eyebrow"
        tone="inherit"
        className="text-text-muted"
      >
        {t("facetPillar")}
      </Heading>

      <ul className="mt-3 flex flex-col gap-1">
        <li>
          <Link
            href={hrefWith(query, null, onlyAvailable)}
            aria-current={currentPillar === null ? "true" : undefined}
            data-testid="facet-pillar-all"
            className={cn(
              "focus-ring flex items-center justify-between rounded-chip px-2 py-2 text-label transition-colors hover:bg-surface-elevation-2",
              currentPillar === null
                ? "font-semibold text-brand-green-900"
                : "text-text-base",
            )}
          >
            {pillarT("all")}
          </Link>
        </li>

        {PUBLICATION_PILLARS.map(({ key, categoryKey, number }) => {
          const isActive = currentPillar === key;
          /* `countByCategory` solo devuelve las categorías que **tienen** filas, así que un pilar
             vacío no viene en el mapa. Se rellena con cero en vez de callarlo: decir «Mente y
             Espíritu 0» ahorra el clic que no lleva a ninguna parte, y esa es la mitad del valor de
             una faceta. `undefined` queda reservado para «no se pueden afirmar». */
          const count = counts ? (counts[categoryKey] ?? 0) : undefined;
          /* Cero no se esconde: decir «Mente y Espíritu 0» ahorra el clic que no lleva a ninguna
             parte, que es la mitad del valor de una faceta. Pero sí se apaga. */
          const isEmpty = count === 0;

          return (
            <li key={key}>
              <Link
                href={hrefWith(query, isActive ? null : key, onlyAvailable)}
                aria-current={isActive ? "true" : undefined}
                data-testid={`facet-pillar-${key}`}
                className={cn(
                  "focus-ring flex items-center justify-between gap-2 rounded-chip px-2 py-2 text-label transition-colors hover:bg-surface-elevation-2",
                  isActive
                    ? "font-semibold text-brand-green-900"
                    : isEmpty
                      ? "text-text-muted"
                      : "text-text-base",
                )}
              >
                <span className="flex items-center gap-2">
                  {/* El número del pilar acompaña siempre al color: Movimiento y Mente contrastan
                      1.14 entre sí como tinta. */}
                  <BadgeCounter tone={key}>{number}</BadgeCounter>
                  {pillarT(key)}
                </span>

                {count === undefined ? null : (
                  <span
                    data-testid={`facet-count-${key}`}
                    className="font-mono text-caption text-text-muted tabular-nums"
                  >
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <hr className="my-4 border-separator" />

      <Heading
        level={2}
        size="eyebrow"
        tone="inherit"
        className="text-text-muted"
      >
        {t("facetAvailability")}
      </Heading>

      {/* Un enlace y no una casilla: la búsqueda entera vive en la dirección, así que este filtro
          se comparte, se guarda y vuelve con el botón de atrás como cualquier otro. Una casilla
          controlada por JavaScript no haría ninguna de las tres. */}
      <Link
        href={hrefWith(query, currentPillar, !onlyAvailable)}
        aria-pressed={onlyAvailable}
        data-testid="facet-only-available"
        className={cn(
          "focus-ring mt-3 flex items-center gap-2 rounded-chip px-2 py-2 text-label transition-colors hover:bg-surface-elevation-2",
          onlyAvailable
            ? "font-semibold text-brand-green-900"
            : "text-text-base",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "grid size-4 shrink-0 place-items-center rounded-chip border",
            onlyAvailable
              ? "border-brand-green-900 bg-brand-green-soft text-brand-green-900"
              : "border-border-field",
          )}
        >
          {onlyAvailable ? "✓" : null}
        </span>
        {t("facetOnlyAvailable")}
      </Link>
    </aside>
  );
}
