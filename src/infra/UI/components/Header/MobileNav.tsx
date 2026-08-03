"use client";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Cross1Icon,
  HamburgerMenuIcon,
} from "@radix-ui/react-icons";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CategoryBranch } from "~/domain/entities/post/taxonomy";
import { type AppHref, Link, usePathname } from "~/i18n/navigation";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { PILLAR_ITEMS, VISIBLE_COMMUNITY_ITEMS } from "./menuItems";
import { categoryEntries, type MenuEntry, panelAt } from "./mobileMenuTree";

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

/* Identificadores de nivel, no textos: qué panel está abierto no puede depender del idioma. */
const COMMUNITY_PANEL = "community";
const CATEGORIES_PANEL = "categories";
const PILLARS_PANEL = "pillars";

const ROW_CLASS = "border-b border-gray-100 dark:border-gray-800 last:border-0";
const ROW_CONTENT_CLASS =
  "w-full flex items-center justify-between py-4 text-lg font-medium text-gray-900 dark:text-gray-100";

/** Una fila que baja un nivel. El chevron apunta a la derecha porque de ahí viene lo que abre. */
function PanelRow({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <li className={ROW_CLASS}>
      <button type="button" onClick={onOpen} className={ROW_CONTENT_CLASS}>
        {label}
        <ChevronRightIcon className="w-6 h-6 text-gray-500" aria-hidden />
      </button>
    </li>
  );
}

function LinkRow({
  href,
  label,
  onNavigate,
}: {
  href: AppHref;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <li className={ROW_CLASS}>
      <Link href={href} onClick={onNavigate} className={ROW_CONTENT_CLASS}>
        {label}
      </Link>
    </li>
  );
}

/**
 * Un nivel del menú.
 *
 * **Los niveles entran desde la derecha y sustituyen al anterior**, no crecen hacia abajo. Con
 * acordeones, abrir «Comunidad» y «Por categoría» sumaba veinte filas a una pantalla de teléfono y
 * todo se resolvía desplazando; así, cada nivel ocupa lo que ocupa y se vuelve con la flecha.
 *
 * La animación es la misma que usa el menú de escritorio (`enterFromRight`), y `motion-safe` la
 * apaga para quien pidió que no le muevan la pantalla.
 */
function MenuLevel({
  entries,
  onOpenPanel,
  onNavigate,
}: {
  entries: readonly MenuEntry[];
  onOpenPanel: (id: string) => void;
  onNavigate: () => void;
}) {
  return (
    <ul className="space-y-2">
      {entries.map((entry) =>
        entry.kind === "panel" ? (
          <PanelRow
            key={entry.id}
            label={entry.label}
            onOpen={() => onOpenPanel(entry.id)}
          />
        ) : (
          <LinkRow
            key={entry.id}
            href={entry.href}
            label={entry.label}
            onNavigate={onNavigate}
          />
        ),
      )}
    </ul>
  );
}

export default function MobileNav({
  children,
  categories,
  isAdmin = false,
}: {
  children: React.ReactNode;
  /** El catálogo con su jerarquía: el menú se recorre por niveles, no aplanado. */
  categories: readonly CategoryBranch[];
  isAdmin?: boolean;
}) {
  const t = useTranslations("nav");
  const tPillars = useTranslations("pillars");
  const tCommon = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  /** Los niveles abiertos, del primero al último. Vacío es el menú de inicio. */
  const [path, setPath] = useState<string[]>([]);

  const isClientMounted = useClientSideMounted();
  useCloseMenuOnNavigation(isOpen, setIsOpen, () => setPath([]));

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

  const closeMenu = () => {
    setIsOpen(false);
    setPath([]);
  };

  /* El árbol se arma en cada render y no se memoriza: son treinta filas de texto ya traducido, y
     `useMemo` aquí costaría más de leer que de calcular. */
  const rootEntries: MenuEntry[] = [
    {
      kind: "panel",
      id: COMMUNITY_PANEL,
      label: t("communityMenu"),
      entries: [
        { kind: "link", id: "home", label: t("publications"), href: "/" },
        {
          kind: "link",
          id: "products",
          label: t("brandProducts"),
          href: "/productos",
        },
        ...VISIBLE_COMMUNITY_ITEMS.map(
          (item): MenuEntry => ({
            kind: "link",
            id: item.titleKey,
            label: t(item.titleKey),
            href: item.href,
          }),
        ),
      ],
    },
    /* `byCategory` y no `catalog`: ese ya nombra el enlace de administración, y dos entradas del
       mismo menú con el mismo texto es lo que confunde a un admin. */
    ...(categories.length > 0
      ? [
          {
            kind: "panel" as const,
            id: CATEGORIES_PANEL,
            label: t("byCategory"),
            entries: categoryEntries(categories),
          },
        ]
      : []),
    {
      kind: "panel",
      id: PILLARS_PANEL,
      label: t("pillarsMenu"),
      entries: PILLAR_ITEMS.map(
        (item): MenuEntry => ({
          kind: "link",
          id: item.titleKey,
          label: tPillars(item.titleKey),
          href: item.href,
        }),
      ),
    },
    { kind: "link", id: "about", label: t("about"), href: "/nosotros" },
  ];

  const openPanel = panelAt(rootEntries, path);
  /* Un camino que ya no existe —una categoría desactivada mientras el menú estaba abierto— se
     trata como estar en el inicio, en vez de pintar un panel fantasma. */
  const currentEntries = openPanel ? openPanel.entries : rootEntries;

  const menuContent = (
    <div
      data-testid="mobile-menu"
      className={`fixed inset-0 z-9999 bg-white/95 dark:bg-black/95 backdrop-blur-xl transition-all duration-300 flex flex-col ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex flex-col h-full container-width py-4">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <Link
            href="/"
            onClick={closeMenu}
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
            onClick={closeMenu}
            className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label={t("closeMenu")}
          >
            <Cross1Icon className="w-8 h-8" />
          </button>
        </div>

        {/* **Un solo desplazamiento para todo**: el menú, los botones de la cuenta y el pie. Antes
            solo se desplazaba la lista de secciones y el resto quedaba clavado abajo, así que en
            una pantalla corta los botones se comían el menú. */}
        <div className="flex-1 overflow-y-auto overscroll-contain pr-2">
          <nav>
            {openPanel ? (
              <div
                /* La `key` es el camino: al bajar otro nivel el nodo se reemplaza y la animación
                   vuelve a correr, que es lo que da la sensación de que el nivel entra desde la
                   derecha en vez de aparecer de golpe. */
                key={path.join("/")}
                className="motion-safe:animate-enterFromRight"
              >
                <button
                  type="button"
                  onClick={() => setPath(path.slice(0, -1))}
                  className="flex items-center gap-1 py-3 text-base font-medium text-gray-500 hover:text-pw-green transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5" aria-hidden />
                  {t("back")}
                </button>
                <p className="pb-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                  {openPanel.label}
                </p>
                <MenuLevel
                  entries={currentEntries}
                  onOpenPanel={(id) => setPath([...path, id])}
                  onNavigate={closeMenu}
                />
              </div>
            ) : (
              <MenuLevel
                entries={currentEntries}
                onOpenPanel={(id) => setPath([...path, id])}
                onNavigate={closeMenu}
              />
            )}
          </nav>

          <div className="flex flex-col gap-3 px-2 pb-6 border-t border-gray-100 dark:border-gray-800 pt-6 mt-4">
            {/* Las mismas dos entradas de administración que ofrece el menú del avatar en
                escritorio: quien cambie de tamaño de pantalla encuentra lo mismo. */}
            {isAdmin ? (
              <div className="flex gap-4">
                <Link
                  href="/admin/catalogo"
                  onClick={closeMenu}
                  className="text-base text-gray-600 dark:text-gray-400 hover:text-pw-green transition-colors"
                >
                  {t("catalog")}
                </Link>
                <Link
                  href="/admin/productos"
                  onClick={closeMenu}
                  className="text-base text-gray-600 dark:text-gray-400 hover:text-pw-green transition-colors"
                >
                  {t("report")}
                </Link>
              </div>
            ) : null}
            {children}
          </div>

          <div className="py-6 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-500">
            {PUBLIC_BRAND_NAME} &copy; {new Date().getFullYear()}
          </div>
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
