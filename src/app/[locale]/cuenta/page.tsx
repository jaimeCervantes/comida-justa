import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { redirectToSignIn } from "~/infra/auth/redirectToSignIn";
import { createBranchRepository } from "~/infra/dataAccess/branches/factory";
import {
  findProfileOfUser,
  findSellerOfUser,
} from "~/infra/dataAccess/identity/sessionIdentity";
import { Heading } from "~/presentation/design_system/typography/Heading";
import BranchList from "~/presentation/directory/BranchList/BranchList";
import {
  addBranch,
  becomeSeller,
  claimUsername,
  updateStoreProfile,
} from "./actions";
import AccountCard from "./ui/AccountCard";
import AccountNav, { ACCOUNT_PAGE_LAYOUT } from "./ui/AccountNav";
import AddBranchForm from "./ui/AddBranchForm";
import BecomeSellerForm from "./ui/BecomeSellerForm";
import StoreCard from "./ui/StoreCard";
import StoreProfileForm from "./ui/StoreProfileForm";
import UsernameSection from "./ui/UsernameSection";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");

  return {
    title: t("heading"),
    description: t("metaDescription"),
    // Es una página privada: no hay nada que indexar y su contenido depende de la sesión.
    robots: { index: false, follow: false },
  };
}

/**
 * El ancho lo pone el layout (`container-width`); aquí solo se reparte en dos columnas a partir
 * de `lg`, para no dejar media pantalla vacía en escritorio.
 *
 * El reparto no es arbitrario: a la izquierda **lo que se enseña** —la tienda y la dirección
 * personal, con su botón de compartir— y a la derecha **lo que se edita** —la ficha y las
 * sucursales—. Antes la dirección personal caía al final de la segunda columna, debajo del alta de
 * sucursales, y era lo último que veía quien entraba a repartir su enlace.
 */
const COLUMNS = "grid gap-6 lg:grid-cols-2 items-start";

export default async function CuentaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("account");
  const tBranches = await getTranslations("branches");

  const session = await auth();

  if (!session) {
    redirectToSignIn(locale, "/cuenta");
  }

  const user = session.user as User | undefined;

  if (!user?.id) {
    redirectToSignIn(locale, "/cuenta");
  }

  /* Los mismos lectores que usa el encabezado. Van cacheados por render, así que las dos filas se
     leen una sola vez aunque las pidan las dos partes de la página. */
  const [seller, profile] = await Promise.all([
    findSellerOfUser(user.id),
    findProfileOfUser(user.id),
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
      <main className={ACCOUNT_PAGE_LAYOUT}>
        <AccountNav
          active="account"
          username={profile?.username ?? null}
          hasStore={false}
        />

        <div>
          <Heading level={1} className="mb-6">
            {t("heading")}
          </Heading>

          <div className={COLUMNS}>
            <BecomeSellerForm action={becomeSeller} defaultName={user.name} />
            {usernameSection}
          </div>
        </div>
      </main>
    );
  }

  const branches = await createBranchRepository().listBySeller(seller.id);

  return (
    <main className={ACCOUNT_PAGE_LAYOUT}>
      <AccountNav
        active="account"
        username={profile?.username ?? null}
        hasStore={true}
      />

      <div>
        <Heading level={1} className="mb-6">
          {t("heading")}
        </Heading>

        <div className={COLUMNS}>
          {/* Lo que se reparte. */}
          <div className="flex flex-col gap-6">
            <StoreCard seller={seller} />
            {usernameSection}
            <AccountCard title={t("branchesHeading")}>
              <BranchList
                branches={branches}
                emptyMessage={tBranches("emptyWithoutLocation")}
              />
            </AccountCard>
          </div>

          {/* Lo que se edita. */}
          <div className="flex flex-col gap-6">
            <StoreProfileForm action={updateStoreProfile} seller={seller} />
            <AddBranchForm action={addBranch} />
          </div>
        </div>
      </div>
    </main>
  );
}
