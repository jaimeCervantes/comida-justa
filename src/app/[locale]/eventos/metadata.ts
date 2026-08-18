import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DEFAULT_SHARE_IMAGE } from "~/infra/constants";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";

export async function buildEventsMetadata(
  locale: string,
  page?: number,
): Promise<Metadata> {
  const t = await getTranslations("events");

  const isFirstPage = !page || page === 1;
  const baseTitle = t("title");
  const title = isFirstPage
    ? baseTitle
    : t("pagedTitle", { title: baseTitle, page });
  const description = t("description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [DEFAULT_SHARE_IMAGE],
      type: "website",
    },
    alternates: localizedAlternates(
      isFirstPage
        ? "/eventos"
        : {
            pathname: "/eventos/page/[page]",
            params: { page: String(page) },
          },
      locale,
    ),
  };
}
