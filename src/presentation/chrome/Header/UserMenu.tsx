"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "~/i18n/navigation";
import { profileHref, storeHref } from "~/i18n/routes";
import {
  MENU_ITEM_CLASS as ITEM_CLASS,
  MENU_CONTENT_CLASS,
  MENU_SEPARATOR_CLASS as SEPARATOR_CLASS,
} from "~/presentation/design_system/styling/menuSurface";

/**
 * Lo que cuelga del avatar de quien ha iniciado sesión.
 *
 * Antes el avatar era un enlace directo a `/cuenta` y el resto —cerrar sesión, y para los
 * administradores el reporte— vivía suelto en la barra, ocupando ancho fijo. Agrupado aquí, la
 * cabecera deja de crecer con cada opción nueva.
 *
 * `avatar` y `signOut` llegan como nodos ya renderizados en el servidor: `SignOut` encierra una
 * Server Action, y este componente es de cliente. Es el mismo reparto que usa `MobileNav`.
 *
 * **La tienda y el perfil se ofrecen solo si existen.** No se pinta una entrada que lleve a dar de
 * alta lo que falta: para eso ya está «Mi cuenta», que es lo único que ven los 20 de 21 usuarios
 * que hoy no han reservado nada.
 */
export default function UserMenu({
  avatar,
  signOut,
  userName,
  isAdmin = false,
  storeHandle = null,
  username = null,
}: {
  avatar: ReactNode;
  signOut: ReactNode;
  userName?: string | null;
  isAdmin?: boolean;
  /** La dirección de su tienda, si la abrió. */
  storeHandle?: string | null;
  /** La dirección personal, si la reservó. */
  username?: string | null;
}) {
  const t = useTranslations("nav");

  return (
    /* `modal={false}`, como el selector de idioma: en modo modal Radix deja el resto de la página
       con `pointer-events: none` y `aria-hidden`, así que el primer toque fuera se gasta en cerrar
       el menú y no llega a donde iba. Con dos desplegables en la misma barra, la diferencia se
       notaba al querer tocar cualquier cosa detrás. */
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={t("openUserMenu")}
          data-testid="user-menu-trigger"
          className="focus-ring rounded-full transition-transform hover:scale-105"
        >
          {avatar}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        {/* Con nombre propio, como `mobile-menu`: el menú móvil pinta lo mismo —el nombre, la
            `@dirección` y los atajos— y el CSS solo lo esconde, no lo quita del DOM. Sin poder
            acotar, una prueba que busque "Mi cuenta" encuentra dos. */}
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={MENU_CONTENT_CLASS}
          data-testid="user-menu"
        >
          {/* La misma cabecera que Instagram y Facebook ponen en este menú: la foto, el nombre y
              la dirección personal. Dice con qué identidad estás mirando el sitio, que es la
              pregunta de quien tiene más de una cuenta. El avatar se repinta aquí a propósito: el
              del disparador queda tapado por el propio desplegable. */}
          {userName || username ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2">
                {avatar}
                <span className="flex min-w-0 flex-col">
                  {userName ? (
                    <span className="truncate text-sm font-medium text-text-base">
                      {userName}
                    </span>
                  ) : null}
                  {username ? (
                    <span className="truncate text-xs text-text-support">
                      {`@${username}`}
                    </span>
                  ) : null}
                </span>
              </div>
              <DropdownMenu.Separator className={SEPARATOR_CLASS} />
            </>
          ) : null}

          {/* Lo propio primero y lo público antes que lo privado: quien abre este menú suele venir
              a verse como lo ven sus clientes, no a editar su ficha. */}
          {storeHandle ? (
            <DropdownMenu.Item asChild>
              <Link
                href={storeHref(storeHandle)}
                className={ITEM_CLASS}
                data-testid="menu-my-store"
              >
                {t("myStore")}
              </Link>
            </DropdownMenu.Item>
          ) : null}

          {/* Mismo gate que la tienda —`storeHandle`—, porque la agenda solo le sirve a quien
              atiende. Está aquí además de en `/cuenta` porque es de las pocas cosas que se abren
              a diario: quien atiende revisa su semana mucho más de lo que edita su ficha. */}
          {storeHandle ? (
            <DropdownMenu.Item asChild>
              <Link
                href="/cuenta/agenda"
                className={ITEM_CLASS}
                data-testid="menu-my-schedule"
              >
                {t("schedule")}
              </Link>
            </DropdownMenu.Item>
          ) : null}

          {username ? (
            <DropdownMenu.Item asChild>
              <Link
                href={profileHref(username)}
                className={ITEM_CLASS}
                data-testid="menu-my-profile"
              >
                {t("myProfile")}
              </Link>
            </DropdownMenu.Item>
          ) : null}

          {/* Antes que «Mi cuenta» porque cambia a diario y la cuenta no: un pedido pendiente es
              alguien esperando respuesta. Se ofrece a todo el mundo, venda o no — la misma página
              enseña lo que te han pedido y lo que has pedido tú. */}
          <DropdownMenu.Item asChild>
            <Link
              href="/pedidos"
              className={ITEM_CLASS}
              data-testid="menu-my-orders"
            >
              {t("myOrders")}
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link href="/cuenta" className={ITEM_CLASS}>
              {t("myAccount")}
            </Link>
          </DropdownMenu.Item>

          {/* Las dos de administración van juntas y separadas del resto: no son parte de la
              cuenta de nadie, son las herramientas internas. El gate real está en cada página. */}
          {isAdmin ? (
            <>
              <DropdownMenu.Separator className={SEPARATOR_CLASS} />
              <DropdownMenu.Item asChild>
                <Link href="/admin/catalogo" className={ITEM_CLASS}>
                  {t("catalog")}
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link href="/admin/productos" className={ITEM_CLASS}>
                  {t("report")}
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link href="/admin/moderacion" className={ITEM_CLASS}>
                  {t("moderation")}
                </Link>
              </DropdownMenu.Item>
            </>
          ) : null}

          <DropdownMenu.Separator className={SEPARATOR_CLASS} />
          {/* `preventDefault` mantiene el menú abierto al pulsar: cerrarlo desmontaría el botón y
              con él su ruedita, justo mientras la sesión se está cerrando. Lo cierra la propia
              navegación que hace la acción. */}
          <DropdownMenu.Item
            onSelect={(event) => event.preventDefault()}
            className="outline-hidden"
          >
            {signOut}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
