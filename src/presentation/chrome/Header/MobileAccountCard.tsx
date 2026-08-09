import type { User } from "next-auth";
import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { profileHref, storeHref } from "~/i18n/routes";
import Avatar from "~/presentation/user/Avatar/Avatar";

const SHORTCUT_CLASS =
  "flex-1 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-200";

/**
 * La cabecera de identidad del menú móvil: quién eres y a qué páginas tuyas se llega.
 *
 * Vivía suelta dentro de `Header`, que ya reparte escritorio, móvil, buscador e idioma. Al ganar
 * los dos atajos se convirtió en un bloque con su propia lógica —qué existe y qué no—, y eso ya no
 * es composición del encabezado.
 *
 * Ofrece **lo mismo que el menú del avatar en escritorio**: quien cambia de tamaño de pantalla no
 * tiene que aprender otro sitio.
 */
export default function MobileAccountCard({
  user,
  storeHandle,
  username,
  onNavigate,
}: {
  user?: User;
  storeHandle: string | null;
  username: string | null;
  /** Lo pasa `MobileNav` para cerrar el menú al navegar. */
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav");

  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/cuenta"
        onClick={onNavigate}
        className="flex items-center gap-3 px-2 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
      >
        <Avatar user={user} />
        <span className="flex min-w-0 flex-col">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {user?.name}
          </span>
          {/* La dirección personal desplaza al texto genérico: dice más y ocupa lo mismo. */}
          <span className="max-w-[200px] truncate text-xs text-gray-500">
            {username ? `@${username}` : t("myAccountAndStore")}
          </span>
        </span>
      </Link>

      {storeHandle || username ? (
        <div className="flex gap-3">
          {storeHandle ? (
            <Link
              href={storeHref(storeHandle)}
              onClick={onNavigate}
              className={SHORTCUT_CLASS}
              data-testid="mobile-my-store"
            >
              {t("myStore")}
            </Link>
          ) : null}
          {username ? (
            <Link
              href={profileHref(username)}
              onClick={onNavigate}
              className={SHORTCUT_CLASS}
              data-testid="mobile-my-profile"
            >
              {t("myProfile")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
