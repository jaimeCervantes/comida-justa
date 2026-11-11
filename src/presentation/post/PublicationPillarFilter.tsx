import { useTranslations } from "next-intl";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  PUBLICATION_PILLARS,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { type AppHref, type AppPathname, Link } from "~/i18n/navigation";
import { BadgeCounter } from "~/presentation/design_system/badges/Badge";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import { CHIP_OFF, CHIP_ON, FILTER_CHIP } from "./ListingFilters/filterChip";
import { listingQuery, type QueryValue } from "./ListingFilters/listingQuery";

interface PublicationPillarFilterProps {
  currentPillar: PublicationPillar | null;
  pathname: AppPathname;
  params?: Record<string, string>;
  query?: Record<string, QueryValue>;
  /** Por omisión asume que va justo debajo de un título o buscador. `NearbyPillarFilter` lo
   * sobrescribe: ahí ya vive dentro de una fila con su propio espaciado. */
  className?: string;
  /**
   * Cuántos resultados hay por pilar, cuando se pueden afirmar.
   *
   * Es lo que convierte el filtro en una **faceta**: un "0" ahorra el clic que no lleva a ninguna
   * parte, y esa es la mitad de su valor. Se indexa por `categoryKey` porque así es como cuenta
   * quien consulta. `null` y `undefined` no son lo mismo: `null` es "no se pueden afirmar" —el
   * rescate semántico respondió y contar palabras describiría otra cosa— y entonces no se enseña
   * ningún número; una clave ausente dentro del mapa sí es un cero.
   */
  counts?: Readonly<Record<string, number>> | null;
  /**
   * Prefijo de `data-testid` por chip, para quien tenga su propio contrato.
   *
   * La búsqueda ya publicaba `facet-pillar-<key>` antes de que este componente la alojara, y ese
   * nombre es el que conocen sus pruebas. Se hereda en vez de renombrarlo: mudar un control no es
   * motivo para romper a quien lo apuntaba.
   */
  testIdPrefix?: string;
}

const PILLAR_CLASSES: Record<
  PublicationPillar,
  { active: string; inactive: string }
> = {
  sleep: {
    active: "border-pillar-sleep-ink bg-pillar-sleep-solid text-white",
    inactive:
      "border-pillar-sleep-ink/30 bg-pillar-sleep-soft text-pillar-sleep-ink hover:border-pillar-sleep-ink/60",
  },
  nutrition: {
    active: "border-pillar-nutrition-ink bg-pillar-nutrition-solid text-white",
    inactive:
      "border-pillar-nutrition-ink/30 bg-pillar-nutrition-soft text-pillar-nutrition-ink hover:border-pillar-nutrition-ink/60",
  },
  movement: {
    active: "border-pillar-movement-ink bg-pillar-movement-solid text-white",
    inactive:
      "border-pillar-movement-ink/30 bg-pillar-movement-soft text-pillar-movement-ink hover:border-pillar-movement-ink/60",
  },
  mindSpirit: {
    active:
      "border-pillar-mind-spirit-ink bg-pillar-mind-spirit-solid text-white",
    inactive:
      "border-pillar-mind-spirit-ink/30 bg-pillar-mind-spirit-soft text-pillar-mind-spirit-ink hover:border-pillar-mind-spirit-ink/60",
  },
};

function hrefForPillar({
  pathname,
  params,
  query,
  pillar,
}: PublicationPillarFilterProps & {
  pillar: PublicationPillar | null;
}): AppHref {
  return {
    pathname,
    params,
    query: listingQuery(query, { [PUBLICATION_PILLAR_QUERY_PARAM]: pillar }),
  } as AppHref;
}

export default function PublicationPillarFilter({
  currentPillar,
  pathname,
  params,
  query,
  className,
  counts,
  testIdPrefix,
}: PublicationPillarFilterProps): React.ReactNode {
  const t = useTranslations("publicationPillars");

  return (
    <nav
      aria-label={t("filterLabel")}
      className={cn("flex flex-wrap items-center gap-2 pt-4", className)}
      data-testid="publication-pillar-filter"
    >
      <Link
        href={hrefForPillar({
          pathname,
          params,
          query,
          currentPillar,
          pillar: null,
        })}
        aria-current={currentPillar === null ? "page" : undefined}
        data-testid={testIdPrefix ? `${testIdPrefix}-all` : undefined}
        className={cn(FILTER_CHIP, currentPillar === null ? CHIP_ON : CHIP_OFF)}
      >
        {t("all")}
      </Link>
      {PUBLICATION_PILLARS.map(({ key, categoryKey, number }) => {
        const active = currentPillar === key;
        const color = PILLAR_CLASSES[key];
        const count = counts ? (counts[categoryKey] ?? 0) : undefined;

        return (
          <Link
            key={key}
            href={hrefForPillar({
              pathname,
              params,
              query,
              currentPillar,
              pillar: key,
            })}
            aria-current={active ? "page" : undefined}
            data-testid={testIdPrefix ? `${testIdPrefix}-${key}` : undefined}
            /* El pilar sin nada se apaga, pero no se esconde ni se desactiva: sigue siendo el
               camino de vuelta cuando ya hay un filtro puesto. */
            className={cn(
              FILTER_CHIP,
              "gap-2 pl-2",
              active ? color.active : color.inactive,
              count === 0 && !active && "opacity-60",
            )}
          >
            {/* El número acompaña siempre al color. Movimiento y Mente contrastan 1.14 entre sí
                como tinta —lo dejó medido `pillarPalette.contrast.test.ts`—, así que quien no
                distingue el tono necesita este dato para saber qué filtro está pulsando. */}
            <BadgeCounter tone={key}>{number}</BadgeCounter>
            {t(key)}
            {count === undefined ? null : (
              <span
                data-testid={testIdPrefix ? `facet-count-${key}` : undefined}
                className="font-mono text-caption tabular-nums opacity-80"
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
