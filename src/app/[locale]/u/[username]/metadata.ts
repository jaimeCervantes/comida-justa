import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { UserProfile } from "~/domain/entities/user/types";
import { resolveLocale } from "~/i18n/routing";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";

export async function buildProfileMetadata(
  profile: UserProfile,
  page?: number,
): Promise<Metadata> {
  const t = await getTranslations("profile");
  const tCommon = await getTranslations("common");

  const name = profile.name ?? profile.username ?? "";
  const title = page && page > 1 ? tCommon("pagedName", { name, page }) : name;
  const description = t("metaDescription", { name, brand: PUBLIC_BRAND_NAME });
  const locale = resolveLocale(await getLocale());
  const username = profile.username ?? "";
  const alternates = localizedAlternates(
    page && page > 1
      ? {
          pathname: "/u/[username]/page/[page]",
          params: { username, page: String(page) },
        }
      : { pathname: "/u/[username]", params: { username } },
    locale,
  );

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates?.canonical?.toString(),
      images: profile.image ? [{ url: profile.image }] : undefined,
    },
  };
}
