import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { readFollowState } from "~/infra/dataAccess/follows/readFollowState";
import { createUserProfileRepository } from "~/infra/dataAccess/users/factory";
import { profileHref, profilePath } from "../../../../cuenta/profilePath";
import { getProfileByUsername } from "../../data";
import { buildProfileMetadata } from "../../metadata";
import ProfileHeader from "../../ui/ProfileHeader";
import ProfilePublications from "../../ui/ProfilePublications";

type Props = {
  params: Promise<{ locale: string; username: string; page: string }>;
};

function parsePage(value: string): number | null {
  const page = parseInt(value, 10);
  return Number.isNaN(page) || page < 1 ? null : page;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, page: pageStr } = await params;
  const page = parsePage(pageStr);
  const profile = page
    ? await createUserProfileRepository().findByUsername(username)
    : null;

  return profile && page ? buildProfileMetadata(profile, page) : {};
}

export default async function ProfilePaginatedPage({ params }: Props) {
  const { username, locale: rawLocale, page: pageStr } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("profile");
  const page = parsePage(pageStr);

  if (!page) {
    notFound();
  }

  const data = await getProfileByUsername(username, page, locale);

  if (!data || (data.publications.length === 0 && page > 1)) {
    notFound();
  }

  return (
    <main>
      <ProfileHeader
        profile={data.profile}
        store={data.store}
        total={data.total}
        follow={
          await readFollowState(
            { kind: "user", userId: data.profile.id },
            viewerId,
          )
        }
        canFollow={Boolean(viewerId)}
        isOwner={Boolean(viewerId) && data.profile.id === viewerId}
        path={profilePath(username, locale)}
      />

      <ProfilePublications
        viewerId={viewerId}
        publications={data.publications}
        username={username}
        currentPage={page}
        totalPages={data.totalPages}
      />

      <div className="text-center mt-4">
        <Link
          href={profileHref(username)}
          className="text-pw-lightgreen hover:underline"
        >
          {t("backToProfile")}
        </Link>
      </div>
    </main>
  );
}
