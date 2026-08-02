import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { LuSalad } from "react-icons/lu";
import { navigableCategories } from "~/domain/entities/post/taxonomy";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import Avatar from "../Avatar/Avatar";
import { SignIn, SignOut } from "../auth-buttons";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import LinkButton from "../LinkButton/LinkButton";
import SearchBar from "../SearchBar";
import MobileNav from "./MobileNav";
import Nav from "./Nav";
import UserMenu from "./UserMenu";

export default async function Header() {
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const session = await auth();
  // El acceso al reporte interno solo se muestra a admins; el gate real está en la página.
  const showAdminLinks = isAdmin(session?.user?.email);

  /* Las categorías del menú salen de la base, no de una constante: se dan de alta desde
     `/admin/catalogo` y tienen que aparecer sin desplegar. La lectura está cacheada
     (`unstable_cache` + `React.cache`), así que el header no paga una consulta por render. */
  const locale = resolveLocale(await getLocale());
  const categories = navigableCategories(await getCategoryTaxonomy(), locale);

  return (
    <header className="sticky top-0 z-50 w-full glass transition-all duration-300">
      <div className="container-width flex h-16 items-center justify-between">
        <div className="flex gap-4 sm:gap-6 items-center">
          <MobileNav isAdmin={showAdminLinks} categories={categories}>
            <LinkButton
              href="/publicar"
              color="green"
              startIcon={<LuSalad />}
              className="w-full justify-center"
              showLoader
            >
              {t("publish")}
            </LinkButton>
            {session ? (
              <div className="flex flex-col gap-4">
                <Link
                  href="/cuenta"
                  className="flex items-center gap-3 px-2 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <Avatar user={session?.user} />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {session.user?.name}
                    </span>
                    <span className="text-xs text-gray-500 truncate max-w-[200px]">
                      {t("myAccountAndStore")}
                    </span>
                  </div>
                </Link>
                <SignOut className="w-full justify-center" showLoader>
                  {t("signOut")}
                </SignOut>
              </div>
            ) : (
              <SignIn className="w-full justify-center" showLoader>
                {t("signIn")}
              </SignIn>
            )}
          </MobileNav>
          <Link
            href="/"
            className="shrink-0 transition-transform hover:scale-105"
          >
            <Image
              src="/logo.webp"
              width={40}
              height={40}
              alt={tCommon("logoAlt", { brand: PUBLIC_BRAND_NAME })}
              priority
            />
          </Link>
          <div className="hidden lg:block">
            <Nav categories={categories} />
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <SearchBar />
        </div>

        <div className="flex gap-4 items-center">
          <LinkButton
            href="/publicar"
            color="green"
            startIcon={<LuSalad title={t("publish")} />}
            aria-label={t("publish")}
            showLoader
          >
            <span className="hidden sm:block">{t("publish")}</span>
          </LinkButton>

          {session ? (
            /* Todo lo de la sesión cuelga del avatar: la cuenta, las herramientas de
               administración y cerrar sesión. Antes estaban sueltos en la barra y cada opción
               nueva le quitaba ancho al resto. */
            <UserMenu
              avatar={<Avatar user={session?.user} />}
              userName={session.user?.name}
              isAdmin={showAdminLinks}
              signOut={
                <SignOut
                  className="w-full justify-center"
                  aria-label={t("signOut")}
                  showLoader
                >
                  {t("signOut")}
                </SignOut>
              }
            />
          ) : (
            <SignIn aria-label={t("signIn")}>
              <span className="hidden sm:block">{t("signIn")}</span>
            </SignIn>
          )}
          <LanguageSwitcher />
        </div>
      </div>
      {/* Mobile Search Bar - Visible only on small/medium screens below navigation depending on layout space */}
      <div className="md:hidden px-4 pb-3">
        <SearchBar />
      </div>
    </header>
  );
}
