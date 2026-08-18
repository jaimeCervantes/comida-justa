import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  parsePublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale } from "~/i18n/routing";
import { decodeSearchTerm } from "../../../decodeTerm";

export default async function LegacySearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; term: string; page: string }>;
  searchParams: Promise<{ pillar?: string }>;
}): Promise<never> {
  const { term, page, locale: rawLocale } = await params;
  const { pillar } = await searchParams;
  const locale = resolveLocale(rawLocale);
  const currentPillar = parsePublicationPillar(pillar);

  redirectKeepingLocale(
    {
      pathname: "/buscar",
      query: {
        q: decodeSearchTerm(term),
        page,
        [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar ?? undefined,
      },
    },
    locale,
  );
}
