import { useTranslations } from "next-intl";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  PUBLICATION_PILLARS,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { type AppHref, type AppPathname, Link } from "~/i18n/navigation";

type QueryValue = string | number | null | undefined;

interface PublicationPillarFilterProps {
  currentPillar: PublicationPillar | null;
  pathname: AppPathname;
  params?: Record<string, string>;
  query?: Record<string, QueryValue>;
}

const BASE_LINK =
  "focus-ring inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors";

const ALL_ACTIVE = "border-pw-green bg-pw-green text-white";

const ALL_INACTIVE =
  "border-separator bg-surface-elevation-1 text-text-base hover:bg-surface-elevation-2";

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

function queryForPillar(
  query: Record<string, QueryValue> | undefined,
  pillar: PublicationPillar | null,
): Record<string, string> | undefined {
  const next = new Map<string, string>();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (
      key === PUBLICATION_PILLAR_QUERY_PARAM ||
      key === "page" ||
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue;
    }
    next.set(key, String(value));
  }

  if (pillar) next.set(PUBLICATION_PILLAR_QUERY_PARAM, pillar);

  return next.size > 0 ? Object.fromEntries(next) : undefined;
}

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
    query: queryForPillar(query, pillar),
  } as AppHref;
}

export default function PublicationPillarFilter({
  currentPillar,
  pathname,
  params,
  query,
}: PublicationPillarFilterProps): React.ReactNode {
  const t = useTranslations("publicationPillars");

  return (
    <nav
      aria-label={t("filterLabel")}
      className="flex flex-wrap items-center gap-2 pt-4"
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
        className={`${BASE_LINK} ${
          currentPillar === null ? ALL_ACTIVE : ALL_INACTIVE
        }`}
      >
        {t("all")}
      </Link>
      {PUBLICATION_PILLARS.map(({ key }) => {
        const active = currentPillar === key;
        const color = PILLAR_CLASSES[key];

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
            className={`${BASE_LINK} ${active ? color.active : color.inactive}`}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
