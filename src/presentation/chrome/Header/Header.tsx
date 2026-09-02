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
import type { ThemePreference } from "~/infra/theme/themeCookie";
import { SignIn, SignOut } from "~/presentation/auth/auth-buttons";
import CartLink from "~/presentation/cart/CartLink/CartLink";
import LinkButton from "~/presentation/navigation/LinkButton/LinkButton";
import HeaderSearchBar from "~/presentation/search/HeaderSearchBar";
import Avatar from "~/presentation/user/Avatar/Avatar";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import MobileAccountCard from "./MobileAccountCard";
import MobileNav from "./MobileNav";
import Nav from "./Nav";
import UserMenu from "./UserMenu";

/**
 * Cuándo las dos acciones de la derecha —«Publicar» e «Iniciar sesión»— enseñan su texto.
 *
 * Los cuatro tramos, y por qué:
 *
 * - **Hasta `sm`**: solo icono. Es lo que ya hacía; en un teléfono no hay ancho que gastar.
 * - **De `sm` a `lg`**: con texto. La barra de navegación todavía no está y sobra sitio.
 * - **De `lg` a `xl`**: solo icono otra vez, y este es el tramo nuevo. La barra aparece en `lg`
 *   (1024px) pero el header no cabía hasta 1280: medido, desbordaba 198px a 1024 y 70px a 1152, y
 *   lo que se salía por el borde era «Iniciar sesión» y el selector de idioma. O sea que el sitio
 *   se veía roto en 256px de ventana de escritorio.
 * - **Desde `xl`**: con texto. Ahí ya caben las dos cosas.
 *
 * Las dos llevan `aria-label` desde antes, así que quedarse sin texto visible no las deja sin
 * nombre: quien usa lector de pantalla oye lo mismo en los cuatro tramos.
 */
const ACTION_LABEL = "hidden sm:block lg:hidden xl:block";

export default async function Header({
  theme,
}: {
  theme: ThemePreference | null;
}) {
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

            <div className="flex justify-start">
              <ThemeToggle initial={theme} showLabel={false} />
            </div>

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
            {/* `preload` y **no** `fetchPriority="high"`. Son dos cosas distintas: la primera
                adelanta la descarga, la segunda la pone por delante de las demás. Este logo mide
                40px y está en todas las páginas — marcarlo urgente le quitaría el turno a la
                imagen que la persona vino a ver. Si todo es urgente, nada lo es.

                Se llamaba `priority`, que Next 16 deprecó a favor de `preload` justo porque hacía
                las dos cosas a la vez y dejó de derivar la segunda. */}
            <Image
              src="/logo.webp"
              width={40}
              height={40}
              alt={tCommon("logoAlt", { brand: PUBLIC_BRAND_NAME })}
              preload
            />
          </Link>
          <div className="hidden lg:block">
            <Nav categories={categories} />
          </div>
        </div>

        {/* `mx-4` hasta `xl` y `mx-8` desde ahí: con la barra de navegación en pantalla, esos 64px
            de margen eran los últimos 20 que se salían del borde a 1024. Desde `xl` sobra sitio y
            el buscador recupera su aire. */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 xl:mx-8">
          <HeaderSearchBar />
        </div>

        <div className="flex gap-4 items-center">
          {/* Desde `lg`, que es donde la barra inferior desaparece. En el teléfono «Publicar» vive
              en el círculo levantado del `BottomNav`, al alcance del pulgar: tenerlo en las dos
              partes duplicaba la única acción primaria del sitio y le quitaba sitio al buscador,
              que es lo que el 5.1 quería recuperar. */}
          <div className="hidden lg:block">
            <LinkButton
              href="/publicar"
              color="green"
              startIcon={<LuSalad title={t("publish")} />}
              aria-label={t("publish")}
              showLoader
            >
              <span className={ACTION_LABEL}>{t("publish")}</span>
            </LinkButton>
          </div>

          {/* Antes de la sesión: el carrito no la pide, y quien está comprando no debería tener que
              buscarlo dentro del menú del avatar. */}
          <CartLink />

          <div className="hidden lg:block">
            <ThemeToggle initial={theme} showLabel={false} />
          </div>

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
            /* Secundaria, no verde. La anotación del 5.1 lo dice: «antes competían tres botones
               verdes y uno negro; ahora hay una acción primaria, un avatar y el idioma». La acción
               primaria del sitio es publicar; acceder es la puerta, no la invitación. */
            <SignIn color="white" aria-label={t("signIn")}>
              <span className={ACTION_LABEL}>{t("signIn")}</span>
            </SignIn>
          )}

          {/* El idioma vive aquí. El 5.16 lo bajaba al pie —«el header ya cargaba con búsqueda,
              publicar y cuenta»— y así se entregó un momento, pero el usuario lo quiere donde
              estaba: en un sitio de dos idiomas, cambiar de idioma es de las primeras cosas que
              alguien busca, y buscarla al final de la página es encontrarla tarde. Vive en un solo
              lugar, no en los dos. */}
          <LanguageSwitcher />
        </div>
      </div>
      {/* Mobile Search Bar - Visible only on small/medium screens below navigation depending on layout space */}
      <div className="md:hidden px-4 pb-3">
        <HeaderSearchBar />
      </div>
    </header>
  );
}
