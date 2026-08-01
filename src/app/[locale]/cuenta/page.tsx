import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { User } from "~/domain/entities/post/types";
import { auth } from "~/infra/auth";
import { SIGNIN_PATH } from "~/infra/constants";
import { createBranchRepository } from "~/infra/dataAccess/branches/factory";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { createUserProfileRepository } from "~/infra/dataAccess/users/factory";
import BranchList from "~/infra/UI/components/BranchList/BranchList";
import { addBranch, becomeSeller, claimUsername } from "./actions";
import AddBranchForm from "./ui/AddBranchForm";
import BecomeSellerForm from "./ui/BecomeSellerForm";
import StoreCard from "./ui/StoreCard";
import UsernameSection from "./ui/UsernameSection";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Tu tienda, tus sucursales y tu dirección personal.",
  // Es una página privada: no hay nada que indexar y su contenido depende de la sesión.
  robots: { index: false, follow: false },
};

/**
 * El ancho lo pone el layout (`container-width`); aquí solo se reparte en dos columnas a partir
 * de `lg`, para no dejar media pantalla vacía en escritorio.
 */
const COLUMNS = "grid gap-10 lg:grid-cols-2 items-start";

export default async function CuentaPage() {
  const session = await auth();

  if (!session) {
    redirect(SIGNIN_PATH);
  }

  const user = session.user as User | undefined;

  if (!user?.id) {
    redirect(SIGNIN_PATH);
  }

  const [seller, profile] = await Promise.all([
    createSellerRepository().findByUserId(user.id),
    createUserProfileRepository().findByUserId(user.id),
  ]);

  const usernameSection = (
    <UsernameSection
      action={claimUsername}
      currentUsername={profile?.username ?? null}
      defaultName={user.name}
    />
  );

  if (!seller) {
    return (
      <main>
        <h1 className="text-xl font-bold mb-6">Mi cuenta</h1>

        <div className={COLUMNS}>
          <BecomeSellerForm action={becomeSeller} defaultName={user.name} />
          {usernameSection}
        </div>
      </main>
    );
  }

  const branches = await createBranchRepository().listBySeller(seller.id);

  return (
    <main>
      <h1 className="text-xl font-bold mb-6">Mi cuenta</h1>

      <div className={COLUMNS}>
        <div className="flex flex-col gap-10">
          <StoreCard seller={seller} />

          <section>
            <h2 className="text-lg font-bold mb-4">Tus sucursales</h2>
            <BranchList branches={branches} />
          </section>

          {usernameSection}
        </div>

        <AddBranchForm action={addBranch} />
      </div>
    </main>
  );
}
