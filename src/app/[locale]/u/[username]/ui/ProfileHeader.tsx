import Image from "next/image";
import { useTranslations } from "next-intl";
import { MdStorefront } from "react-icons/md";
import type { Seller } from "~/domain/entities/seller/types";
import type { UserProfile } from "~/domain/entities/user/types";
import { Link } from "~/i18n/navigation";
import { storePath } from "../../../cuenta/storePath";

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
          {profile.name ?? profile.username}
        </h1>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("publicationCount", { total })}
        </p>

        {store?.handle ? (
          <Link
            href={storePath(store.handle)}
            data-testid="profile-store-link"
            className="mt-2 inline-flex items-center gap-2 font-bold text-pw-orange"
          >
            <MdStorefront size="20" aria-hidden />
            {`Su tienda: ${store.name}`}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
