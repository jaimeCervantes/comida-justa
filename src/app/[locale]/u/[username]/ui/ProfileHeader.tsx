import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { MdStorefront } from "react-icons/md";
import type { Seller } from "~/domain/entities/seller/types";
import type { UserProfile } from "~/domain/entities/user/types";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import type { FollowSnapshot } from "~/infra/dataAccess/follows/readFollowState";
import FollowButton from "~/presentation/follow/FollowButton/FollowButton";
import FollowerCount from "~/presentation/follow/FollowerCount";
import ShareMenu from "~/presentation/sharing/ShareMenu/ShareMenu";
import { profilePath } from "../../../cuenta/profilePath";
import { storeHref } from "../../../cuenta/storePath";

export default function ProfileHeader({
  profile,
  store,
  total,
  follow,
  isOwner = false,
  canFollow,
  path,
}: {
  profile: UserProfile;
  store: Seller | null;
  total: number;
  /** Cuántos la siguen y si quien mira ya lo hace. Lo resuelve la página: aquí no se consulta. */
  follow: FollowSnapshot;
  /** Nadie se sigue a sí mismo; a quien es dueño se le invita a compartir su página. */
  isOwner?: boolean;
  /** Si quien mira tiene sesión: sin ella, seguir lleva a entrar. */
  canFollow: boolean;
  path: string;
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

        <p className="text-sm text-text-support">
          {t("publicationCount", { total })}
        </p>

        {/* Los dos son `inline-flex`, así que caían en el mismo renglón **pegados**: entre ellos
            JSX se come el espacio en blanco por llevar salto de línea, y sus `mt-*` son margen
            superior, que entre dos elementos en línea no separa nada. Puestos en una fila con
            `gap` se separan de verdad, y se van a la línea siguiente cuando no quepan. El
            `justify-center` sigue al `text-center` de la cabecera, que en `sm` pasa a la izquierda. */}
        {isOwner ? (
          <FollowerCount total={follow.followers} />
        ) : (
          <FollowButton
            followedId={profile.id}
            canFollow={canFollow}
            followers={follow.followers}
            isFollowing={follow.isFollowing}
            path={path}
          />
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start">
          {store?.handle ? (
            <Link
              href={storeHref(store.handle)}
              data-testid="profile-store-link"
              className="inline-flex items-center gap-2 font-bold text-pw-orange"
            >
              <MdStorefront size="20" aria-hidden />
              {t("theirStore", { name: store.name })}
            </Link>
          ) : null}

          {/* En la voz de quien mira, no en la de quien publica: aquí comparte el visitante. */}
          {username ? (
            <ShareMenu
              testId="share-profile-page"
              url={`${PUBLIC_BASE_URL}${profilePath(username, locale)}`}
              title={displayName}
              text={tShare("profileText", { name: displayName })}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
