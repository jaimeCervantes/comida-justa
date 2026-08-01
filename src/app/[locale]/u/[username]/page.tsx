import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
import { PAGINATION_INIT_PAGE } from "~/infra/constants";
import { createUserProfileRepository } from "~/infra/dataAccess/users/factory";
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

  // Fuera de cualquier `<Suspense>`: un perfil inexistente debe salir con status 404 y no con un
  // 200 que solo "parece" un 404.
  const data = await getProfileByUsername(
    username,
    PAGINATION_INIT_PAGE,
    locale,
  );

  if (!data) {
    notFound();
  }

  return (
    <main>
      <ProfileHeader
        profile={data.profile}
        store={data.store}
        total={data.total}
      />

      <ProfilePublications
        publications={data.publications}
        username={username}
        currentPage={PAGINATION_INIT_PAGE}
        totalPages={data.totalPages}
      />
    </main>
  );
}
