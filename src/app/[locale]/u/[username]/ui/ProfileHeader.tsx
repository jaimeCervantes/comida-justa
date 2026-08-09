import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { MdStorefront } from "react-icons/md";
import type { Seller } from "~/domain/entities/seller/types";
import type { UserProfile } from "~/domain/entities/user/types";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import ShareMenu from "~/presentation/sharing/ShareMenu/ShareMenu";
import { profilePath } from "../../../cuenta/profilePath";
import { storeHref } from "../../../cuenta/storePath";

export default function ProfileHeader({
  profile,
  store,
  total,
}: {
  profile: UserProfile;
  store: Seller | null;
  total: number;
}) {
  const t = useTranslations("profile");
  const tShare = useTranslations("share");
  const locale = resolveLocale(useLocale());
  /* `username` es nulo mientras no se reclama la dirección, y sin ella no existe `/u/…`: a esta
     cabecera solo se llega con una reclamada. El tipo no lo sabe, así que en vez de forzarlo se
     omite el botón — compartir una dirección que no resuelve es peor que no ofrecerla. */
  const username = profile.username;
  const displayName = profile.name ?? username ?? "";

  return (
    <header className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
      {profile.image ? (
        <Image
          src={profile.image}
          alt={`Foto de ${profile.name ?? profile.username}`}
          width={96}
          height={96}
          priority
          className="h-24 w-24 shrink-0 rounded-full object-cover"
        />
      ) : null}

      <div>
        <h1 className="text-3xl font-bold" data-testid="profile-name">
          {displayName}
        </h1>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("publicationCount", { total })}
        </p>

        {store?.handle ? (
          <Link
            href={storeHref(store.handle)}
            data-testid="profile-store-link"
            className="mt-2 inline-flex items-center gap-2 font-bold text-pw-orange"
          >
            <MdStorefront size="20" aria-hidden />
            {t("theirStore", { name: store.name })}
          </Link>
        ) : null}

        {/* En la voz de quien mira, no en la de quien publica: aquí comparte el visitante. */}
        {username ? (
          <ShareMenu
            className="mt-3"
            testId="share-profile-page"
            url={`${PUBLIC_BASE_URL}${profilePath(username, locale)}`}
            title={displayName}
            text={tShare("profileText", { name: displayName })}
          />
        ) : null}
      </div>
    </header>
  );
}
