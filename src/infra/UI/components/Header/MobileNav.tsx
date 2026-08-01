"use client";
import {
  ChevronDownIcon,
  Cross1Icon,
  HamburgerMenuIcon,
} from "@radix-ui/react-icons";
import type React from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, usePathname } from "~/i18n/navigation";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";

interface MenuItem {
  title: string;
  items: { title: string; href: string; description: string }[];
}

const MENU_ITEMS: MenuItem[] = [
  {
    title: "4 Pilares",
    items: [
      {
        title: "Sueño y Descanso",
        href: "/pilares/sueno",
        description:
          "Optimizar la higiene del sueño para tu recuperación biológica",
      },
      {
        title: "Alimentación natural y nutritiva",
        href: "/pilares/alimentacion",
        description: "Conexión con el origen, alimentos locales y reales",
      },
      {
        title: "Ejercicio y Movimiento",
        href: "/pilares/movimiento",
        description: "Combatir el sedentarismo con actividad física funcional",
      },
      {
        title: "Emociones, Mente, Espíritu y Comunidad",
        href: "/pilares/mente-espiritu",
        description: "Gestión emocional, mental y conexión con los demás",
      },
    ],
  },
  {
    title: "Comunidad",
    items: [
      {
        title: "Grupos",
        href: "/habitos/grupos",
        description: "Grupos locales de apoyo",
      },
      {
        title: "Salud infantil",
        href: "/salud-infantil",
        description: "Alimentación saludable para niños",
      },
      {
        title: "Medio ambiente",
        href: "/medio-ambiente",
        description: "Impacto ambiental positivo",
      },
      {
        title: "Productores locales",
        href: "/productores-locales",
        description: "Apoyo a la producción local",
      },
      {
        title: "Negocios locales",
        href: "/negocios-locales",
        description: "Guía de negocios locales",
      },
      {
        title: "Deportes",
        href: "/deportes",
        description: "Dónde practicar deportes",
      },
    ],
  },
];

import Image from "next/image";

function useClientSideMounted() {
  const [isMounted, setIsMounted] = useState(false);

  // Next.js hydration workaround:
  // createPortal can only be used on the client-side (requires document.body).
  // We use this effect to track when the component has mounted in the browser.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  return isMounted;
}

function useCloseMenuOnNavigation(
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void,
  setOpenSubmenu: (submenu: string | null) => void,
) {
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  // This smoothly resets the mobile navigation states whenever the route changes.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (isOpen) {
      setIsOpen(false);
      setOpenSubmenu(null);
    }
  }
}

export default function MobileNav({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const isClientMounted = useClientSideMounted();
  useCloseMenuOnNavigation(isOpen, setIsOpen, setOpenSubmenu);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  const menuContent = (
    <div
      className={`fixed inset-0 z-9999 bg-white/95 dark:bg-black/95 backdrop-blur-xl transition-all duration-300 flex flex-col ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex flex-col h-full container-width py-4 overflow-hidden">
        <div className="flex justify-between items-center mb-8 shrink-0">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2"
          >
            <Image src="/logo.webp" width={40} height={40} alt="Logo" />
            {/* Mismo logotipo que el pie: verde sólido para que se lean todas las letras. */}
            <span className="text-xl font-bold text-pw-green">
              {PUBLIC_BRAND_NAME}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Cerrar menú"
          >
            <Cross1Icon className="w-8 h-8" />
          </button>
        </div>

        <nav className="flex-1 pr-2">
          <ul className="space-y-2">
            {MENU_ITEMS.map((section) => (
              <li
                key={section.title}
                className="border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <button
                  type="button"
                  onClick={() => toggleSubmenu(section.title)}
                  className="w-full flex items-center justify-between py-4 text-lg font-medium text-gray-900 dark:text-gray-100"
                >
                  {section.title}
                  <ChevronDownIcon
                    className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${
                      openSubmenu === section.title ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openSubmenu === section.title
                      ? "max-h-[500px] opacity-100 mb-4"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <ul className="space-y-1 pl-4 border-l-2 border-pw-green/20 ml-2">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="block py-3 text-base text-gray-600 dark:text-gray-400 hover:text-pw-green dark:hover:text-pw-green transition-colors"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
            <li className="border-b border-gray-100 dark:border-gray-800 last:border-0">
              <Link
                href="/nosotros"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-between py-4 text-lg font-medium text-gray-900 dark:text-gray-100"
              >
                Nosotros
              </Link>
            </li>
            <li className="border-b border-gray-100 dark:border-gray-800 last:border-0">
              <Link
                href="/productos"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-between py-4 text-lg font-medium text-gray-900 dark:text-gray-100"
              >
                Productos
              </Link>
            </li>
            {isAdmin && (
              <li className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <Link
                  href="/admin/productos"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-between py-4 text-lg font-medium text-gray-900 dark:text-gray-100"
                >
                  Reporte
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="flex flex-col gap-4 px-2 pb-6 border-t border-gray-100 dark:border-gray-800 pt-6">
          {children}
        </div>

        <div className="py-6 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-500 shrink-0">
          {PUBLIC_BRAND_NAME} &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        aria-label="Abrir menú"
      >
        <HamburgerMenuIcon className="w-6 h-6" />
      </button>

      {isClientMounted &&
        typeof document !== "undefined" &&
        createPortal(menuContent, document.body)}
    </div>
  );
}
