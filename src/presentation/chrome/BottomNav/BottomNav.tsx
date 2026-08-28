"use client";

import { useTranslations } from "next-intl";
import {
  MdAdd,
  MdHome,
  MdOutlineHome,
  MdOutlineSearch,
  MdOutlineStorefront,
  MdPerson,
  MdPersonOutline,
  MdSearch,
  MdStorefront,
} from "react-icons/md";
import { Link, usePathname } from "~/i18n/navigation";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import {
  activeBottomNavTab,
  BOTTOM_NAV_TABS,
  type BottomNavTabId,
} from "./bottomNavTabs";

/**
 * La barra inferior del teléfono: las cinco cosas que se hacen aquí, siempre al alcance del pulgar.
 *
 * Es la pantalla 5.1 del canvas de v2. Hasta ahora, en un teléfono todo colgaba del menú de
 * hamburguesa: buscar, ver tus pedidos o entrar a tu cuenta costaban dos toques y leer una lista de
 * treinta filas. El pulgar llega abajo; a la esquina superior izquierda, no.
 *
 * **No sustituye al menú de hamburguesa.** Ese sigue teniendo el catálogo entero, las categorías y
 * las secciones; esto son los cinco destinos que se repiten todos los días. Un bottom nav que
 * intenta contener un sitio entero acaba siendo el mismo menú con otra forma.
 *
 * Solo existe por debajo de `lg`, que es justo donde la barra de navegación de escritorio se
 * esconde: las dos nunca se ven a la vez.
 */
const ICONS: Record<
  BottomNavTabId,
  {
    active: React.ComponentType<{ className?: string }>;
    idle: React.ComponentType<{ className?: string }>;
  }
> = {
  home: { active: MdHome, idle: MdOutlineHome },
  search: { active: MdSearch, idle: MdOutlineSearch },
  publish: { active: MdAdd, idle: MdAdd },
  products: { active: MdStorefront, idle: MdOutlineStorefront },
  account: { active: MdPerson, idle: MdPersonOutline },
};

export default function BottomNav(): React.ReactNode {
  const t = useTranslations("nav");
  const active = activeBottomNavTab(usePathname());

  return (
    <nav
      aria-label={t("bottomNavLabel")}
      data-testid="bottom-nav"
      /* `pb-[env(safe-area-inset-bottom)]`: en un iPhone la franja del gesto de inicio se come los
         últimos ~34px, y sin esto la fila de etiquetas queda debajo de ella. */
      className="fixed inset-x-0 bottom-0 z-50 border-t border-separator bg-surface-elevation-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-5 items-end gap-0.5 px-2 pt-2 pb-3">
        {BOTTOM_NAV_TABS.map((tab) => {
          const isActive = active === tab.id;
          const Icon = isActive ? ICONS[tab.id].active : ICONS[tab.id].idle;
          const isPublish = tab.id === "publish";

          return (
            <li key={tab.id}>
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                data-testid={`bottom-nav-${tab.id}`}
                className={cn(
                  "focus-ring flex flex-col items-center gap-1 rounded-control py-1 transition-colors",
                  isActive ? "text-brand-green-900" : "text-text-support",
                )}
              >
                {/* Publicar es la acción, no un destino más: va en un círculo relleno y levantado,
                    como en el 5.1. Las otras cuatro son sitios a los que se va; esta es algo que se
                    hace, y esa diferencia tiene que verse sin leer. */}
                <span
                  aria-hidden
                  className={cn(
                    "grid place-items-center",
                    isPublish
                      ? "size-11 -mt-4 rounded-full bg-button-primary-bg text-button-primary-text shadow-md"
                      : "size-6",
                  )}
                >
                  <Icon className={isPublish ? "size-6" : "size-6"} />
                </span>

                <span
                  className={cn(
                    "text-tiny leading-none",
                    isActive ? "font-semibold" : "font-medium",
                  )}
                >
                  {t(tab.labelKey)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
