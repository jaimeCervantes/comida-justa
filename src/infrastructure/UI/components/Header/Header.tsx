import Image from "next/image";
import { SignIn, SignOut } from "../auth-buttons";
import Avatar from "../Avatar/Avatar";
import Nav from "./Nav";
import { auth } from "~/infrastructure/auth";
import Link from "next/link";
import { LuSalad } from "react-icons/lu";
import Button from "../Button/Button";
import SearchBar from "../SearchBar";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import MobileNav from "./MobileNav";

export default async function Header({ locale }: { locale: string }) {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full glass transition-all duration-300">
      <div className="container-width flex h-16 items-center justify-between">
        <div className="flex gap-4 sm:gap-6 items-center">
          <MobileNav />
          <Link
            href="/"
            className="flex-shrink-0 transition-transform hover:scale-105"
          >
            <Image
              src="/logo.png"
              width={40}
              height={40}
              alt="Logo Comida Justa"
              priority
              className="rounded-full"
            />
          </Link>
          <div className="hidden lg:block">
            <Nav />
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <SearchBar />
        </div>

        <div className="flex gap-4 items-center">
          <Link href="/publicar" className="hidden sm:block">
            <Button color="green" startIcon={<LuSalad title="Publicar" />}>
              Publicar
            </Button>
          </Link>

          {session ? (
            <div className="flex items-center gap-3">
              <Avatar user={session?.user} />
              <div className="hidden lg:block text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                <SignOut>Salir</SignOut>
              </div>
            </div>
          ) : (
            <SignIn>Iniciar sesión</SignIn>
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
