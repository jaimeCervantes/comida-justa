import type { ReactNode } from "react";
import { readViewerId } from "~/infra/auth/readViewerId";
import {
  findProfileOfUser,
  findSellerOfUser,
} from "~/infra/dataAccess/identity/sessionIdentity";
import AccountNav, {
  ACCOUNT_PAGE_LAYOUT,
  type AccountSectionKey,
} from "./AccountNav";

/**
 * El envoltorio de la sección «lo mío»: el menú a la izquierda y la página al lado.
 *
 * **Existe porque el montaje estaba escrito cinco veces.** `/cuenta` (dos ramas), `/pedidos` y
 * `/cuenta/agenda` (dos ramas) repetían el mismo `<main className={ACCOUNT_PAGE_LAYOUT}>` con su
 * `<AccountNav>` y el mismo `Promise.all` de perfil y vendedor. Cinco sitios donde desalinear una
 * sección que el 5.15 pide que se vea como una sola, y que crecían a ocho al sumar `/habitos`.
 * Ahora la decisión de layout se toma aquí y las páginas solo dicen **de qué página son**.
 *
 * **Los dos lectores no cuestan una segunda consulta.** `findSellerOfUser` y `findProfileOfUser`
 * van cacheados por render, así que leerlos aquí y otra vez dentro de la página —`/cuenta` los
 * necesita para su contenido— sigue siendo una lectura de cada uno.
 *
 * **Sin sesión no monta el menú, y no es un caso hipotético.** `/cuenta`, `/pedidos` y
 * `/cuenta/agenda` redirigen antes de llegar aquí, pero `/habitos` es una página **pública**:
 * ofrecerle «Mi cuenta / Mis pedidos» a quien no ha entrado sería un menú de destinos que la
 * mandan a identificarse. Quien no tiene sesión ve la página tal cual, sin sección alrededor.
 */
export default async function AccountSection({
  active,
  children,
}: {
  active: AccountSectionKey;
  children: ReactNode;
}): Promise<React.ReactElement> {
  const viewerId = await readViewerId();

  if (!viewerId) return <main>{children}</main>;

  const [seller, profile] = await Promise.all([
    findSellerOfUser(viewerId),
    findProfileOfUser(viewerId),
  ]);

  return (
    <main className={ACCOUNT_PAGE_LAYOUT}>
      <AccountNav
        active={active}
        username={profile?.username ?? null}
        hasStore={Boolean(seller)}
      />

      <div>{children}</div>
    </main>
  );
}
