"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "~/i18n/navigation";

const ITEM_CLASS =
  "block w-full select-none rounded-[6px] px-3 py-2 text-[15px] leading-none text-gray-700 dark:text-gray-200 no-underline outline-hidden transition-colors data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-800 data-[highlighted]:text-pw-green cursor-pointer";

const SEPARATOR_CLASS = "my-1 h-px bg-gray-200 dark:bg-gray-800";

/**
 * Lo que cuelga del avatar de quien ha iniciado sesión.
 *
 * Antes el avatar era un enlace directo a `/cuenta` y el resto —cerrar sesión, y para los
 * administradores el reporte— vivía suelto en la barra, ocupando ancho fijo. Agrupado aquí, la
 * cabecera deja de crecer con cada opción nueva.
 *
 * `avatar` y `signOut` llegan como nodos ya renderizados en el servidor: `SignOut` encierra una
 * Server Action, y este componente es de cliente. Es el mismo reparto que usa `MobileNav`.
 */
export default function UserMenu({
  avatar,
  signOut,
  userName,
  isAdmin = false,
}: {
  avatar: ReactNode;
  signOut: ReactNode;
  userName?: string | null;
  isAdmin?: boolean;
}) {
  const t = useTranslations("nav");

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={t("openUserMenu")}
          className="focus-ring rounded-full transition-transform hover:scale-105"
        >
          {avatar}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-9999 min-w-[220px] rounded-[10px] border border-gray-200 bg-white p-2 shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] dark:border-gray-800 dark:bg-gray-900"
        >
          {userName ? (
            <>
              <p className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {userName}
              </p>
              <DropdownMenu.Separator className={SEPARATOR_CLASS} />
            </>
          ) : null}

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
