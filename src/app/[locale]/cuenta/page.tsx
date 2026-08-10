import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { SIGNIN_PATH } from "~/infra/constants";
import { createBranchRepository } from "~/infra/dataAccess/branches/factory";
import {
  findProfileOfUser,
  findSellerOfUser,
} from "~/infra/dataAccess/identity/sessionIdentity";
import { createOrderRepository } from "~/infra/dataAccess/orders/factory";
import BranchList from "~/presentation/directory/BranchList/BranchList";
import {
  addBranch,
  becomeSeller,
  claimUsername,
  updateStoreProfile,
} from "./actions";
import AccountCard from "./ui/AccountCard";
import AddBranchForm from "./ui/AddBranchForm";
import BecomeSellerForm from "./ui/BecomeSellerForm";
import SellerOrders from "./ui/SellerOrders";
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
  const { locale } = await params;
  setRequestLocale(resolveLocale(locale));
  const t = await getTranslations("account");
  const tBranches = await getTranslations("branches");
  const tOrders = await getTranslations("orders");

  const session = await auth();

  if (!session) {
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
  }

  const user = session.user as User | undefined;

  if (!user?.id) {
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
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
      <main>
        <h1 className="text-xl font-bold mb-6">{t("heading")}</h1>

        <div className={COLUMNS}>
          <BecomeSellerForm action={becomeSeller} defaultName={user.name} />
          {usernameSection}
        </div>
      </main>
    );
  }

  /* Las dos lecturas del vendedor van juntas: son independientes y en serie costaban dos viajes. */
  const [branches, orders] = await Promise.all([
    createBranchRepository().listBySeller(seller.id),
    createOrderRepository().listBySeller(seller.id),
  ]);

  return (
    <main>
      <h1 className="text-xl font-bold mb-6">{t("heading")}</h1>

      <div className={COLUMNS}>
        {/* Lo que se reparte. */}
        <div className="flex flex-col gap-6">
          <StoreCard seller={seller} />
          {/* Los pedidos van arriba del todo tras la tienda: es lo único de esta pantalla que pide
              una acción con prisa. Lo demás —la ficha, las sucursales— se toca una vez y se olvida. */}
          <AccountCard title={tOrders("sellerHeading")}>
            <SellerOrders orders={orders} />
          </AccountCard>
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
    </main>
  );
}
