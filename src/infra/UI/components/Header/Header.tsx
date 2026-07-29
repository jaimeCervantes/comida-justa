import Image from "next/image";
import Link from "next/link";
import { LuSalad } from "react-icons/lu";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { Button } from "~/presentation/design_system/buttons/Button";
import Avatar from "../Avatar/Avatar";
import { SignIn, SignOut } from "../auth-buttons";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import LinkButton from "../LinkButton/LinkButton";
import SearchBar from "../SearchBar";
import MobileNav from "./MobileNav";
import Nav from "./Nav";

export default async function Header({ locale }: { locale: string }) {
  const session = await auth();
  // El acceso al reporte interno solo se muestra a admins; el gate real está en la página.
  const showAdminLinks = isAdmin(session?.user?.email);

  return (
    <header className="sticky top-0 z-50 w-full glass transition-all duration-300">
      <div className="container-width flex h-16 items-center justify-between">
        <div className="flex gap-4 sm:gap-6 items-center">
          <MobileNav isAdmin={showAdminLinks}>
            <LinkButton
              href="/publicar"
              color="green"
              startIcon={<LuSalad />}
              className="w-full justify-center"
              showLoader
            >
              Publicar
            </LinkButton>
            {session ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 px-2 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <Avatar user={session?.user} />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {session.user?.name}
                    </span>
                    <span className="text-xs text-gray-500 truncate max-w-[200px]">
                      {session.user?.email}
                    </span>
                  </div>
                </div>
                <SignOut className="w-full justify-center" showLoader>
                  Cerrar sesión
                </SignOut>
              </div>
            ) : (
              <SignIn className="w-full justify-center" showLoader>
                Iniciar sesión
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
              alt={`Logo ${PUBLIC_BRAND_NAME}`}
              priority
            />
          </Link>
          <div className="hidden lg:block">
            <Nav isAdmin={showAdminLinks} />
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <SearchBar />
        </div>

        <div className="flex gap-4 items-center">
          <LinkButton
            href="/publicar"
            color="green"
            startIcon={<LuSalad title="Publicar" />}
            aria-label="Publicar"
            showLoader
          >
            <span className="hidden sm:block">Publicar</span>
          </LinkButton>

          {session ? (
            <div className="flex items-center gap-3">
              <Avatar user={session?.user} />
              <div className="hidden lg:block text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                <SignOut aria-label="Cerrar sesión" showLoader>
                  Salir
                </SignOut>
              </div>
            </div>
          ) : (
            <SignIn aria-label="Iniciar sesión">
              <span className="hidden sm:block">Iniciar sesión</span>
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
