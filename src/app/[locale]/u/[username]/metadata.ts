import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { UserProfile } from "~/domain/entities/user/types";
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
  const path = profilePath(profile.username ?? "");
  const canonical = page && page > 1 ? `${path}/page/${page}` : path;

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
