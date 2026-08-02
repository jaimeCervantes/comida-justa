import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { UserProfile } from "~/domain/entities/user/types";
import { getPathname } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { CANONICAL_URL, PUBLIC_BRAND_NAME } from "~/infra/constants";
import { profilePath } from "../../cuenta/profilePath";

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
  const canonical =
    page && page > 1
      ? getPathname({
          href: {
            pathname: "/u/[username]/page/[page]",
            params: { username, page: String(page) },
          },
          locale,
        })
      : profilePath(username, locale);

  return {
    title,
    description,
    alternates: { canonical: `${CANONICAL_URL}${canonical}` },
    openGraph: {
      title,
      description,
      url: `${CANONICAL_URL}${canonical}`,
      images: profile.image ? [{ url: profile.image }] : undefined,
    },
  };
}
