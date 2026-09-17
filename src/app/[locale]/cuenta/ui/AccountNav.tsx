import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { type AppHref, Link } from "~/i18n/navigation";
import { profileHref } from "~/i18n/routes";

/* El mismo par que ya mide `brandPalette.contrast.test.ts` para la píldora activa del menú
   principal (`Nav.tsx`): un `bg`/`text` que cambia de valor con el tema, sin una sola `dark:`. */
const ITEM_ACTIVE = "font-semibold bg-brand-green-soft text-brand-green-900";
const ITEM_IDLE =
  "font-medium text-text-base hover:bg-surface-elevation-2 hover:text-highlight";
/* `shrink-0`: en el teléfono este renglón se desliza y nada se comprime; en la columna de
   escritorio no estorba, porque ahí el eje que importa es el vertical. */
const ITEM_CLASS =
  "focus-ring block shrink-0 rounded-control px-3.5 py-2.5 text-sm transition-colors";

/**
 * La tarjeta que envuelve el renglón en el teléfono, y que desaparece en escritorio.
 *
 * Es el mismo trato que ya usan `SearchFacets` y `NearbyPillarFilter`: una tira que se arrastra
 * necesita su propia superficie (`surface-elevation-1`) para que el desvanecido de `scroll-hint-x`
 * —que toma ese color de fondo— no se note contra el fondo de la página, que es un tono distinto
 * (`surface-background`). En `lg:` no hace falta: ahí no hay nada que arrastrar.
 */
const NAV_CLASS =
  "rounded-card border border-separator bg-surface-elevation-1 lg:rounded-none lg:border-0 lg:bg-transparent";

/**
 * El renglón que se desliza en el teléfono y se apila en escritorio.
 *
 * Mismas tres piezas que `NearbyBar`/`SearchFacets` — `overflow-x-auto`, `no-scrollbar` y
 * `scroll-hint-x` sobre una fila `flex` sin salto de línea— y por el mismo motivo: es la fila
 * entera la que se arrastra con el dedo, no cada enlace por su cuenta. `items-center` centra el
 * texto de una fila; en la columna de `lg:` hay que devolver el `items-stretch` que un `flex-col`
 * trae por omisión, o los enlaces se encogerían a su propio texto y perderían el fondo de ancho
 * completo al pasar el ratón.
 */
const NAV_ROW_CLASS =
  "no-scrollbar scroll-hint-x flex items-center gap-2 overflow-x-auto px-3 py-2 lg:flex-col lg:items-stretch lg:gap-1 lg:overflow-visible lg:p-0";

/**
 * `AccountNav` a la izquierda, el contenido de la página a la derecha — el `240px minmax(0, 1fr)`
 * que pide el 5.15 del canvas. Vive aquí y no repetida en cada `page.tsx` porque las tres páginas
 * que montan este menú tienen que verse como una sola sección, no tres decisiones de layout que
 * podrían desalinearse.
 *
 * **En el teléfono ya no se apila: se desliza.** Era una lista vertical de hasta seis enlaces
 * puesta encima del contenido, y el usuario lo pidió igual que ya se lee el resto del sitio: una
 * fila que se arrastra con el dedo, como los pilares o las facetas de `/buscar`, en vez de un muro
 * de texto que empuja el título hacia abajo.
 *
 * **La columna del teléfono también se declara `minmax(0, 1fr)`**, y no se deja implícita. Una pista
 * de cuadrícula sin declarar es `auto`, que tiene `min-width: auto`: crece hasta el contenido más
 * ancho que le metan en vez de contenerlo. Medido en `/pedidos` a 390 px, unas pestañas que pedían
 * 403 px estiraban la columna entera a 449 y el sitio se desplazaba en horizontal — el menú y el
 * título incluidos, que sí cabían. Con el `minmax(0, …)` el que se pasa se lo come él solo.
 */
export const ACCOUNT_PAGE_LAYOUT =
  "grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start";

/**
 * De qué página de la sección se trata.
 *
 * Es una unión y no un `string` para que añadir una entrada al menú obligue a decidir si se puede
 * marcar: una página que se cuelga de la sección sin estar en esta lista quedaría con el menú
 * puesto y ninguna entrada señalada, o sea diciendo «estás en la cuenta» sin decir dónde.
 */
export type AccountSectionKey =
  | "account"
  | "appointments"
  | "orders"
  | "inventory"
  | "schedule"
  | "habits";

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
 * **`active` es obligatoria, no una que se calcula sola.** Ninguna página puede leer su propia ruta
 * para adivinar cuál marcar —Radix no interviene aquí, es una prop de verdad— así que cada página
 * dice de qué página es. Quien lo monta no es cada `page.tsx` sino `AccountSection`, que además
 * decide **si** toca montarlo.
 *
 * «Publicaciones» sigue sin entrada en esta unión, y ahora por un motivo más fuerte que «no monta
 * este menú»: `/u/[username]` es **la página pública que ve cualquiera**, así que a su dueño no se
 * le puede enseñar con una columna de menú que sus visitantes no ven —vería su propio perfil
 * distinto de como lo reparte—. Ahí el hilo de vuelta lo pone `AccountBackBar`.
 */
export default function AccountNav({
  active,
  username,
  hasStore,
}: {
  active: AccountSectionKey;
  username: string | null;
  hasStore: boolean;
}) {
  const t = useTranslations("nav");

  return (
    <nav
      aria-label={t("myAccount")}
      data-testid="account-nav"
      className={NAV_CLASS}
    >
      <div className={NAV_ROW_CLASS}>
        <NavItem href="/cuenta" active={active === "account"}>
          {t("myAccount")}
        </NavItem>

        {username ? (
          <NavItem href={profileHref(username)}>{t("myPublications")}</NavItem>
        ) : null}

        <NavItem href="/pedidos" active={active === "orders"}>
          {t("myOrders")}
        </NavItem>

        <NavItem href="/citas" active={active === "appointments"}>
          {t("appointments")}
        </NavItem>

        {/* Las dos de tienda van juntas y bajo la misma condición: sin tienda, ni hay catálogo que
            contar ni agenda que llenar. Enseñarlas llevaría a dos pantallas que sólo saben decir
            «primero abre una tienda». */}
        {hasStore ? (
          <>
            <NavItem href="/cuenta/inventario" active={active === "inventory"}>
              {t("inventory")}
            </NavItem>

            <NavItem href="/cuenta/agenda" active={active === "schedule"}>
              {t("schedule")}
            </NavItem>
          </>
        ) : null}

        <NavItem href="/habitos" active={active === "habits"}>
          {t("myHabits")}
        </NavItem>
      </div>
    </nav>
  );
}
