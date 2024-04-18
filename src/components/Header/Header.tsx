import Image from "next/image";
import { SignIn, SignOut } from "../auth-buttons";
import Avatar from "../ui/Avatar/Avatar";
import Nav from "./Nav";
import { auth } from "~/auth";
import Link from "next/link";
import { LuSalad } from "react-icons/lu";
import Button from "~/components/ui/Button/Button";

export default async function Header() {
  const session = await auth();

  return (
    <header className="relative z-10 pb-2 sm:pb-0 flex flex-col sm:flex-row items-center justify-between px-4 gap-4 bg-pw-white dark:bg-pw-gray shadow-blackA4 dark:shadow-none shadow-[0_2px_10px]">
      <div className="flex gap-2">
        <Link href="/">
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
      <div className="flex gap-2">
        <Link href="/publicar">
          <Button color="green" startIcon={<LuSalad title="Publicar" />}>
            Publicar
          </Button>
        </Link>
        {session ? (
          <>
            <Avatar user={session?.user} />
            <SignOut>Cerrar sesion</SignOut>
          </>
        ) : (
          <SignIn>Iniciar sesion</SignIn>
        )}
      </div>
    </header>
  );
}
