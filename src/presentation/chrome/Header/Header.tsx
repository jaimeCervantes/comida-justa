import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { LuSalad } from "react-icons/lu";
import {
  categoryTree,
  navigableCategories,
} from "~/domain/entities/post/taxonomy";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import { findPublicAddresses } from "~/infra/dataAccess/identity/sessionIdentity";
import { SignIn, SignOut } from "~/presentation/auth/auth-buttons";
import CartLink from "~/presentation/cart/CartLink/CartLink";
import LinkButton from "~/presentation/navigation/LinkButton/LinkButton";
import SearchBar from "~/presentation/search/SearchBar";
import Avatar from "~/presentation/user/Avatar/Avatar";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import MobileAccountCard from "./MobileAccountCard";
import MobileNav from "./MobileNav";
import Nav from "./Nav";
import UserMenu from "./UserMenu";

export default async function Header() {
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const session = await auth();
  // El acceso al reporte interno solo se muestra a admins; el gate real está en la página.
  const showAdminLinks = isAdmin(session?.user?.email);

  /* Las direcciones propias, para que el menú del avatar lleve a la tienda y al perfil sin pasar
     por `/cuenta`. Van cacheadas por render: en `/cuenta`, que lee lo mismo, no se repite. */
  const { storeHandle, username } = session?.user?.id
    ? await findPublicAddresses(session.user.id)
    : { storeHandle: null, username: null };

  /* Las categorías del menú salen de la base, no de una constante: se dan de alta desde
     `/admin/catalogo` y tienen que aparecer sin desplegar. La lectura está cacheada
     (`unstable_cache` + `React.cache`), así que el header no paga una consulta por render. */
  const locale = resolveLocale(await getLocale());
  const taxonomy = await getCategoryTaxonomy();
  /* Dos lecturas del mismo catálogo: el escritorio lo enseña aplanado —su desplegable es ancho y
     las reparte en columnas— y el móvil por niveles, porque ahí cada fila se paga en
     desplazamiento. */
  const categories = navigableCategories(taxonomy, locale);
  const categoryBranches = categoryTree(taxonomy, locale);

  return (
    <header className="sticky top-0 z-50 w-full glass transition-all duration-300">
      <div className="container-width flex h-16 items-center justify-between">
        <div className="flex gap-4 sm:gap-6 items-center">
          <MobileNav isAdmin={showAdminLinks} categories={categoryBranches}>
            {session ? (
              <MobileAccountCard
                user={session.user}
                storeHandle={storeHandle}
                username={username}
              />
            ) : null}

            {/* Publicar y la sesión, en una fila de dos columnas: son las dos acciones del menú y
                una debajo de la otra ocupaban el alto de tres filas del propio menú. */}
            <div className="grid grid-cols-2 gap-3">
              <LinkButton
                href="/publicar"
                color="green"
                size="sm"
                startIcon={<LuSalad />}
                className="w-full justify-center"
                showLoader
              >
                {t("publish")}
              </LinkButton>
              {session ? (
                <SignOut size="sm" className="w-full justify-center" showLoader>
                  {t("signOut")}
                </SignOut>
              ) : (
                <SignIn size="sm" className="w-full justify-center" showLoader>
                  {t("signIn")}
                </SignIn>
              )}
            </div>
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

          {/* Antes de la sesión: el carrito no la pide, y quien está comprando no debería tener que
              buscarlo dentro del menú del avatar. */}
          <CartLink />

          {session ? (
            /* Todo lo de la sesión cuelga del avatar: la cuenta, las herramientas de
               administración y cerrar sesión. Antes estaban sueltos en la barra y cada opción
               nueva le quitaba ancho al resto. */
            <UserMenu
              avatar={<Avatar user={session?.user} />}
              userName={session.user?.name}
              isAdmin={showAdminLinks}
              storeHandle={storeHandle}
              username={username}
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
