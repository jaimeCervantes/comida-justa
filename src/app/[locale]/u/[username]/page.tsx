import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { buildProfileJsonLd } from "~/domain/seo/jsonLd/site";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { CANONICAL_URL, PAGINATION_INIT_PAGE } from "~/infra/constants";
import { readFollowState } from "~/infra/dataAccess/follows/readFollowState";
import { createUserProfileRepository } from "~/infra/dataAccess/users/factory";
import JsonLd from "~/presentation/seo/JsonLd";
import { profilePath } from "../../cuenta/profilePath";
import { getProfileByUsername } from "./data";
import { buildProfileMetadata } from "./metadata";
import ProfileHeader from "./ui/ProfileHeader";
import ProfilePublications from "./ui/ProfilePublications";

type Props = {
  params: Promise<{ locale: string; username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await createUserProfileRepository().findByUsername(username);

  return profile ? buildProfileMetadata(profile) : {};
}

export default async function ProfilePage({ params }: Props) {
  const { username, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const viewerId = await readViewerId();

  // Fuera de cualquier `<Suspense>`: un perfil inexistente debe salir con status 404 y no con un
  // 200 que solo "parece" un 404.
  const data = await getProfileByUsername(
    username,
    PAGINATION_INIT_PAGE,
    locale,
    viewerId,
  );

  if (!data) {
    notFound();
  }

  return (
    <main>
      <JsonLd
        data={buildProfileJsonLd({
          url: `${CANONICAL_URL}${profilePath(username, locale)}`,
          name: data.profile.name ?? username,
          imageUrl: data.profile.image,
        })}
      />
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
        currentPage={PAGINATION_INIT_PAGE}
        totalPages={data.totalPages}
      />
    </main>
  );
}
