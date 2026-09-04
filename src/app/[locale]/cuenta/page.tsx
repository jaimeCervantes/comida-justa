import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { readAccountSetup } from "~/domain/entities/seller/accountSetup";
import type { Branch } from "~/domain/entities/seller/types";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { redirectToSignIn } from "~/infra/auth/redirectToSignIn";
import { createBranchRepository } from "~/infra/dataAccess/branches/factory";
import {
  findProfileOfUser,
  findSellerOfUser,
} from "~/infra/dataAccess/identity/sessionIdentity";
import {
  addBranch,
  becomeSeller,
  claimUsername,
  updateStoreProfile,
} from "./actions";
import { ANCHOR } from "./anchors";
import AccountHeader from "./ui/AccountHeader";
import AccountSection from "./ui/AccountSection";
import BecomeSellerForm from "./ui/BecomeSellerForm";
import BranchesCard from "./ui/BranchesCard";
import SetupChecklist from "./ui/SetupChecklist";
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
 * **El reparto cambió de criterio en el slice 1 de `005-2026-09-04-cuenta-configurable`.** Era «lo
 * que se enseña» a la izquierda y «lo que se edita» a la derecha, y ese corte partía las sucursales
 * en dos: la lista en una columna y su alta en la otra, a media pantalla la una de la otra. Ahora
 * las dos columnas son **dos temas** —la tienda y sus sucursales—, así que lo que se lee junto está
 * junto. Lo que se enseña de verdad —las direcciones públicas— subió a la cabecera, que es donde se
 * mira al entrar.
 */
const COLUMNS = "grid gap-6 lg:grid-cols-2 items-start";

/** La cabecera y la lista de pendientes ocupan el ancho entero, encima de las dos columnas. */
const PAGE_STACK = "flex flex-col gap-6";

export default async function CuentaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  /* La página ya no lee el catálogo: desde el slice 2 no le queda ni un texto propio. Cada bloque
     traduce lo suyo, que es lo que hace que mover uno de columna no toque este archivo. */
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

  /* Sin tienda no hay sucursales que pedir: la consulta se ahorra en vez de devolver una lista
     vacía que nadie pinta. */
  const branches: Branch[] = seller
    ? await createBranchRepository().listBySeller(seller.id)
    : [];

  /* Ni una consulta más que antes: los cinco pasos salen de lo que la página ya leyó para pintarse. */
  const setup = readAccountSetup({
    storeName: seller?.name ?? null,
    username: profile?.username ?? null,
    logoUrl: seller?.logoUrl ?? null,
    description: seller?.description ?? null,
    branchCoordinates: branches.map((branch) => branch.coordinates),
  });

  /* La dirección reservada la enseña la cabecera; aquí solo queda el formulario de quien todavía no
     tiene ninguna, que no es un duplicado sino la acción que falta. */
  const usernameSection = profile?.username ? null : (
    <UsernameSection
      id={ANCHOR.username}
      action={claimUsername}
      defaultName={user.name}
    />
  );

  const header = (
    <AccountHeader
      storeName={seller?.name ?? null}
      logoUrl={seller?.logoUrl ?? null}
      handle={seller?.handle ?? null}
      username={profile?.username ?? null}
    />
  );

  if (!seller) {
    return (
      <AccountSection active="account">
        <div className={PAGE_STACK}>
          {header}
          <SetupChecklist setup={setup} />

          {/* Uno debajo del otro y no en dos columnas. En columnas pesaban lo mismo, así que la
              pantalla ofrecía dos decisiones sin relación al mismo nivel; apilados, el orden dice
              cuál va primero — y es el mismo orden que la lista de pendientes de arriba ya
              enumera. */}
          <BecomeSellerForm
            id={ANCHOR.store}
            action={becomeSeller}
            defaultName={user.name}
          />
          {usernameSection}
        </div>
      </AccountSection>
    );
  }

  return (
    <AccountSection active="account">
      <div className={PAGE_STACK}>
        {header}
        <SetupChecklist setup={setup} />

        {/* A ancho completo y no en una columna: es una acción pendiente —la misma que reclama la
            lista de arriba—, y metida en la columna izquierda empujaba la ficha hacia abajo
            dejando media pantalla vacía a la derecha. Cuando ya hay dirección no se pinta nada. */}
        {usernameSection}

        <div className={COLUMNS}>
          {/* La tienda. */}
          <StoreProfileForm
            id={ANCHOR.storeProfile}
            action={updateStoreProfile}
            seller={seller}
          />

          {/* Sus sucursales: la lista y su alta, en una sola tarjeta desde el slice 2. */}
          <BranchesCard branches={branches} action={addBranch} />
        </div>
      </div>
    </AccountSection>
  );
}
