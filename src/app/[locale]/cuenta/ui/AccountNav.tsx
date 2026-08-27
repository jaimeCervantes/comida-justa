import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { type AppHref, Link } from "~/i18n/navigation";
import { profileHref } from "~/i18n/routes";

/* El mismo par que ya mide `brandPalette.contrast.test.ts` para la píldora activa del menú
   principal (`Nav.tsx`): un `bg`/`text` que cambia de valor con el tema, sin una sola `dark:`. */
const ITEM_ACTIVE = "font-semibold bg-brand-green-soft text-brand-green-900";
const ITEM_IDLE =
  "font-medium text-text-base hover:bg-surface-elevation-2 hover:text-highlight";
const ITEM_CLASS =
  "focus-ring block rounded-control px-3.5 py-2.5 text-sm transition-colors";

function NavItem({
  href,
  active,
  children,
}: {
  href: AppHref;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${ITEM_CLASS} ${active ? ITEM_ACTIVE : ITEM_IDLE}`}
    >
      {children}
    </Link>
  );
}

/**
 * La navegación interna de `/cuenta`, del 5.15.
 *
 * El canvas la dibuja como un menú de cinco entradas al lado del contenido; hasta este slice esas
 * cinco vivían sueltas en el menú del avatar (`UserMenu`), y «Mis hábitos» no tenía ningún camino
 * de vuelta desde la cuenta —`/habitos` es una página pública, sin enlace desde aquí—.
 *
 * **No reinventa destinos.** «Mis publicaciones» lleva al mismo perfil público que ya ofrece
 * `UserMenu` como «Mi perfil»: `ProfilePublications` ya resuelve quién mira y le ofrece editar y
 * marcar agotado sus propias publicaciones, así que construir una segunda pantalla habría sido
 * duplicar lo que ya existe con otro nombre.
 *
 * **El mismo filtro que `UserMenu` para lo que no existe todavía.** Sin usuario reservado no hay
 * perfil que enseñar, y sin tienda abierta la agenda no sirve para nada: se ocultan en vez de
 * llevar a dar de alta lo que falta, que es lo que ya resolvió la nota de aquel componente.
 *
 * **Sin prop `active`.** Solo `/cuenta` la monta hoy, así que «Mi cuenta» es siempre la entrada
 * activa. El día que `/pedidos` o `/cuenta/agenda` la hereden, ahí es cuando gana sentido decir
 * cuál está activa desde fuera.
 */
export default function AccountNav({
  username,
  hasStore,
}: {
  username: string | null;
  hasStore: boolean;
}) {
  const t = useTranslations("nav");

  return (
    <nav
      aria-label={t("myAccount")}
      data-testid="account-nav"
      className="flex flex-col gap-1"
    >
      <NavItem href="/cuenta" active>
        {t("myAccount")}
      </NavItem>

      {username ? (
        <NavItem href={profileHref(username)}>{t("myPublications")}</NavItem>
      ) : null}

      <NavItem href="/pedidos">{t("myOrders")}</NavItem>

      {hasStore ? (
        <NavItem href="/cuenta/agenda">{t("schedule")}</NavItem>
      ) : null}

      <NavItem href="/habitos">{t("myHabits")}</NavItem>
    </nav>
  );
}
