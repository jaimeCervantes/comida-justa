import type { Metadata } from "next";
import type { UserProfile } from "~/domain/entities/user/types";
import { CANONICAL_URL } from "~/infra/constants";
import { profilePath } from "../../cuenta/profilePath";

export function buildProfileMetadata(
  profile: UserProfile,
  page?: number,
): Metadata {
  const name = profile.name ?? profile.username ?? "";
  const title = page && page > 1 ? `${name} — página ${page}` : name;
  const description = `Lo que publica ${name} en Hazlo Sano.`;
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
