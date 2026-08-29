import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { parsePublicationPillar } from "~/domain/entities/post/publicationPillars";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { readFollowState } from "~/infra/dataAccess/follows/readFollowState";
import { createUserProfileRepository } from "~/infra/dataAccess/users/factory";
import { profileHref, profilePath } from "../../../../cuenta/profilePath";
import AccountBackBar from "../../../../cuenta/ui/AccountBackBar";
import { getProfileByUsername } from "../../data";
import { buildProfileMetadata } from "../../metadata";
import ProfileHeader from "../../ui/ProfileHeader";
import ProfilePublications from "../../ui/ProfilePublications";

type Props = {
  params: Promise<{ locale: string; username: string; page: string }>;
  searchParams: Promise<{ pillar?: string }>;
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

export default async function ProfilePaginatedPage({
  params,
  searchParams,
}: Props) {
  const { username, locale: rawLocale, page: pageStr } = await params;
  const { pillar } = await searchParams;
  const locale = resolveLocale(rawLocale);
  const currentPillar = parsePublicationPillar(pillar);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("profile");
  const page = parsePage(pageStr);

  if (!page) {
    notFound();
  }

  const data = await getProfileByUsername(
    username,
    page,
    locale,
    viewerId,
    currentPillar,
  );

  if (!data || (data.publications.length === 0 && page > 1)) {
    notFound();
  }

  /* El hilo de vuelta también aquí: la paginación es la misma pantalla, y perderlo al pasar a la
     página 2 sería devolver el callejón sin salida un desplazamiento más abajo. */
  const isOwner = Boolean(viewerId) && data.profile.id === viewerId;
  const tNav = await getTranslations("nav");

  return (
    <main>
      {isOwner ? <AccountBackBar current={tNav("myPublications")} /> : null}

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
        isOwner={isOwner}
        path={profilePath(username, locale)}
      />

      <ProfilePublications
        viewerId={viewerId}
        publications={data.publications}
        username={username}
        currentPage={page}
        totalPages={data.totalPages}
        currentPillar={currentPillar}
      />

      <div className="text-center mt-4">
        <Link
          href={profileHref(username)}
          className="text-highlight hover:underline"
        >
          {t("backToProfile")}
        </Link>
      </div>
    </main>
  );
}
