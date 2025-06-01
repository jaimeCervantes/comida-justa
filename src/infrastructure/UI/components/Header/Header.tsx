import Image from "next/image";
import { SignIn, SignOut } from "../auth-buttons";
import Avatar from "../Avatar/Avatar";
import Nav from "./Nav";
import { auth } from "~/infrastructure/auth";
import Link from "next/link";
import { LuSalad } from "react-icons/lu";
import Button from "../Button/Button";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

export default async function Header({ locale }: { locale: string }) {
  const session = await auth();

  return (
    <header className="relative z-10 pb-2 sm:pb-0 flex flex-col sm:flex-row items-center justify-between px-4 gap-4 bg-pw-white dark:bg-pw-gray shadow-blackA4 dark:shadow-none shadow-[0_2px_10px]">
      <div className="flex gap-2 items-center">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/logo.png"
            width={47}
            height={47}
            alt="Logo Comida Justa"
            priority
          />
        </Link>
        <Nav />
      </div>
      <div className="flex gap-2 items-center">
        <Link href="/publicar">
          <Button color="green" startIcon={<LuSalad title="Publicar" />}>
            Publicar
          </Button>
        </Link>
        {session ? (
          <>
            <Avatar user={session?.user} />
            <SignOut>Cerrar sesión</SignOut>
          </>
        ) : (
          <SignIn>Iniciar sesión</SignIn>
        )}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
