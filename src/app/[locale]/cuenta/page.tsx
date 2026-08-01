import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { User } from "~/domain/entities/post/types";
import { auth } from "~/infra/auth";
import { SIGNIN_PATH } from "~/infra/constants";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { becomeSeller } from "./actions";
import BecomeSellerForm from "./ui/BecomeSellerForm";
import StoreCard from "./ui/StoreCard";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Tu tienda y tus datos de vendedor.",
  // Es una página privada: no hay nada que indexar y su contenido depende de la sesión.
  robots: { index: false, follow: false },
};

export default async function CuentaPage() {
  const session = await auth();

  if (!session) {
    redirect(SIGNIN_PATH);
  }

  const user = session.user as User | undefined;

  if (!user?.id) {
    redirect(SIGNIN_PATH);
  }

  const seller = await createSellerRepository().findByUserId(user.id);

  return (
    <main className="p-4 max-w-2xl mx-auto">
      {seller ? (
        <StoreCard seller={seller} />
      ) : (
        <BecomeSellerForm action={becomeSeller} defaultName={user.name} />
      )}
    </main>
  );
}
