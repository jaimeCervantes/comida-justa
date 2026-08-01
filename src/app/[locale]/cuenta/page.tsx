import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { SIGNIN_PATH } from "~/infra/constants";
import { createBranchRepository } from "~/infra/dataAccess/branches/factory";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { createUserProfileRepository } from "~/infra/dataAccess/users/factory";
import BranchList from "~/infra/UI/components/BranchList/BranchList";
import {
  addBranch,
  becomeSeller,
  claimUsername,
  updateStoreProfile,
} from "./actions";
import AddBranchForm from "./ui/AddBranchForm";
import BecomeSellerForm from "./ui/BecomeSellerForm";
import StoreCard from "./ui/StoreCard";
import StoreProfileForm from "./ui/StoreProfileForm";
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

export default async function CuentaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(resolveLocale(locale));
  const t = await getTranslations("account");
  const tBranches = await getTranslations("branches");

  const session = await auth();

  if (!session) {
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
  }

  const user = session.user as User | undefined;

  if (!user?.id) {
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
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
        <h1 className="text-xl font-bold mb-6">{t("heading")}</h1>

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
      <h1 className="text-xl font-bold mb-6">{t("heading")}</h1>

      <div className={COLUMNS}>
        <div className="flex flex-col gap-10">
          <StoreCard seller={seller} />
          <StoreProfileForm action={updateStoreProfile} seller={seller} />
        </div>

        <div className="flex flex-col gap-10">
          <section>
            <h2 className="text-lg font-bold mb-4">{t("branchesHeading")}</h2>
            <BranchList
              branches={branches}
              emptyMessage={tBranches("emptyWithoutLocation")}
            />
          </section>

          <AddBranchForm action={addBranch} />

          {usernameSection}
        </div>
      </div>
    </main>
  );
}
