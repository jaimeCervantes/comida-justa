"use client";
import {
  ChevronDownIcon,
  Cross1Icon,
  HamburgerMenuIcon,
} from "@radix-ui/react-icons";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type AppHref, Link, usePathname } from "~/i18n/navigation";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { COMMUNITY_ITEMS, PILLAR_ITEMS } from "./menuItems";

/**
 * Las descripciones del menú móvil eran versiones acortadas de las del menú de escritorio
 * ("Grupos locales de apoyo" frente a "Grupos locales, donde te apoyan a alcanzar tus metas").
 * Al extraerlas se unificaron en una sola redacción: mantener dos textos para la misma entrada
 * significaba traducir el doble para que dijeran lo mismo, y el desplegable tiene sitio de sobra.
 */

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

/* Identificadores de sección, no textos: cuál acordeón está abierto no puede depender del idioma. */
const PILLARS_SECTION = "pillars";
const COMMUNITY_SECTION = "community";

const ROW_CLASS = "border-b border-gray-100 dark:border-gray-800 last:border-0";
const ROW_LINK_CLASS =
  "w-full flex items-center justify-between py-4 text-lg font-medium text-gray-900 dark:text-gray-100";

function Section({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <li className={ROW_CLASS}>
      <button type="button" onClick={onToggle} className={ROW_LINK_CLASS}>
        {title}
        <ChevronDownIcon
          className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[500px] opacity-100 mb-4" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="space-y-1 pl-4 border-l-2 border-pw-green/20 ml-2">
          {children}
        </ul>
      </div>
    </li>
  );
}

function SectionLink({
  href,
  children,
}: {
  href: AppHref;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="block py-3 text-base text-gray-600 dark:text-gray-400 hover:text-pw-green dark:hover:text-pw-green transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

export default function MobileNav({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const t = useTranslations("nav");
  const tPillars = useTranslations("pillars");
  const tCommon = useTranslations("common");
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
            <Image
              src="/logo.webp"
              width={40}
              height={40}
              alt={tCommon("logoAlt", { brand: PUBLIC_BRAND_NAME })}
            />
            {/* Mismo logotipo que el pie: verde sólido para que se lean todas las letras. */}
            <span className="text-xl font-bold text-pw-green">
              {PUBLIC_BRAND_NAME}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label={t("closeMenu")}
          >
            <Cross1Icon className="w-8 h-8" />
          </button>
        </div>

        <nav className="flex-1 pr-2">
          <ul className="space-y-2">
            <Section
              title={t("pillarsMenu")}
              isOpen={openSubmenu === PILLARS_SECTION}
              onToggle={() => toggleSubmenu(PILLARS_SECTION)}
            >
              {PILLAR_ITEMS.map((item) => (
                <SectionLink key={item.titleKey} href={item.href}>
                  {tPillars(item.titleKey)}
                </SectionLink>
              ))}
            </Section>

            <Section
              title={t("communityMenu")}
              isOpen={openSubmenu === COMMUNITY_SECTION}
              onToggle={() => toggleSubmenu(COMMUNITY_SECTION)}
            >
              {COMMUNITY_ITEMS.map((item) => (
                <SectionLink key={item.titleKey} href={item.href}>
                  {t(item.titleKey)}
                </SectionLink>
              ))}
            </Section>

            <li className={ROW_CLASS}>
              <Link
                href="/nosotros"
                onClick={() => setIsOpen(false)}
                className={ROW_LINK_CLASS}
              >
                {t("about")}
              </Link>
            </li>
            <li className={ROW_CLASS}>
              <Link
                href="/productos"
                onClick={() => setIsOpen(false)}
                className={ROW_LINK_CLASS}
              >
                {t("products")}
              </Link>
            </li>
            {isAdmin && (
              <li className={ROW_CLASS}>
                <Link
                  href="/admin/productos"
                  onClick={() => setIsOpen(false)}
                  className={ROW_LINK_CLASS}
                >
                  {t("report")}
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
        aria-label={t("openMenu")}
      >
        <HamburgerMenuIcon className="w-6 h-6" />
      </button>

      {isClientMounted &&
        typeof document !== "undefined" &&
        createPortal(menuContent, document.body)}
    </div>
  );
}
