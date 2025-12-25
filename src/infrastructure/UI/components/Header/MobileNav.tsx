"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  HamburgerMenuIcon,
  Cross1Icon,
  ChevronDownIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItem {
  title: string;
  items: { title: string; href: string; description: string }[];
}

const MENU_ITEMS: MenuItem[] = [
  {
    title: "Comida sana",
    items: [
      {
        title: "Platillos",
        href: "/platillos",
        description: "Platillos locales con ingredientes locales",
      },
      {
        title: "Frutas",
        href: "/frutas",
        description: "Frutas locales sin químicos",
      },
      {
        title: "Verduras",
        href: "/verduras",
        description: "Verduras locales sin químicos",
      },
      {
        title: "Semillas",
        href: "/semillas",
        description: "Semillas sin químicos",
      },
    ],
  },
  {
    title: "Comunidad",
    items: [
      { title: "Hábitos", href: "/habitos", description: "Hábitos saludables" },
      {
        title: "Grupos",
        href: "/habitos/grupos",
        description: "Grupos locales de apoyo",
      },
      {
        title: "Deportes",
        href: "/deportes",
        description: "Dónde practicar deportes",
      },
      {
        title: "Aprendizaje",
        href: "/aprendizaje",
        description: "Aprender más con hábitos saludables",
      },
    ],
  },
  {
    title: "Justicia",
    items: [
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
        title: "Productores",
        href: "/productores-locales",
        description: "Apoyo a la producción local",
      },
      {
        title: "Negocios locales",
        href: "/negocios-locales",
        description: "Guía de negocios locales",
      },
    ],
  },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

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
      className={`fixed inset-0 z-[9999] bg-white/95 dark:bg-black/95 backdrop-blur-xl transition-all duration-300 flex flex-col ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex flex-col h-full container-width py-4 overflow-hidden">
        <div className="flex justify-between items-center mb-8 flex-shrink-0">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pw-green to-teal-500">
            Menú
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Cerrar menú"
          >
            <Cross1Icon className="w-8 h-8" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto pr-2">
          <ul className="space-y-2 pb-20">
            {MENU_ITEMS.map((section) => (
              <li
                key={section.title}
                className="border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <button
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
          </ul>
        </nav>

        <div className="mt-auto py-6 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-500 flex-shrink-0">
          Comida Justa &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        aria-label="Abrir menú"
      >
        <HamburgerMenuIcon className="w-6 h-6" />
      </button>

      {mounted &&
        typeof document !== "undefined" &&
        createPortal(menuContent, document.body)}
    </div>
  );
}
