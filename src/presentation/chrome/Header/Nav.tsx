"use client";
import { CaretDownIcon } from "@radix-ui/react-icons";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { useTranslations } from "next-intl";
import type { CategoryOption } from "~/domain/entities/post/taxonomy";
import { type AppHref, Link } from "~/i18n/navigation";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import ListItem from "./ListItem";
import {
  COMMUNITY_OVERVIEW_HREF,
  PILLAR_ITEMS,
  PILLARS_OVERVIEW_HREF,
  VISIBLE_COMMUNITY_ITEMS,
} from "./menuItems";

const SECTION_LINK_CLASS =
  "text-gray-700 dark:text-gray-200 hover:text-pw-green focus:text-pw-green flex select-none items-center rounded-l-[4px] py-2 pl-3 text-[15px] font-medium leading-none outline-hidden transition-colors";

const SECTION_TRIGGER_CLASS =
  "text-gray-700 dark:text-gray-200 hover:text-pw-green focus:text-pw-green group flex select-none items-center rounded-r-[4px] py-2 pl-1 pr-3 outline-hidden transition-colors";

const LINK_CLASS =
  "text-gray-700 dark:text-gray-200 hover:text-pw-green focus:text-pw-green block select-none rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-hidden transition-colors";

const CARET_CLASS =
  "text-pw-green relative top-px transition-transform duration-[250] ease-in group-data-[state=open]:-rotate-180";

/** Enlace de una categoría dentro del desplegable: solo la etiqueta, sin descripción. */
const CATEGORY_LINK_CLASS =
  "text-gray-700 dark:text-gray-200 hover:bg-mauve3 hover:text-pw-green block select-none rounded-[6px] px-3 py-2 text-[15px] leading-none no-underline outline-hidden transition-colors";

function SectionControl({
  href,
  label,
  openLabel,
}: {
  href: AppHref;
  label: string;
  openLabel: string;
}) {
  return (
    <div className="relative flex items-center justify-center">
      <NavigationMenu.Link asChild>
        <Link href={href} className={SECTION_LINK_CLASS}>
          <span data-testid="section-label">{label}</span>
        </Link>
      </NavigationMenu.Link>
      <NavigationMenu.Trigger
        className={SECTION_TRIGGER_CLASS}
        aria-label={openLabel}
      >
        <CaretDownIcon className={CARET_CLASS} aria-hidden />
        <span
          aria-hidden
          className="pointer-events-none absolute top-full left-1/2 z-1 h-[22px] w-4 -translate-x-1/2 opacity-0 transition-opacity group-data-[state=open]:opacity-100"
        >
          <span
            data-testid="submenu-indicator"
            className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 border-x-8 border-x-transparent border-b-8 border-b-white dark:border-b-gray-900"
          />
        </span>
      </NavigationMenu.Trigger>
    </div>
  );
}

/**
 * La barra principal.
 *
 * Empezó con cinco elementos —«4 Pilares», «Comunidad», «Nosotros», «Productos» y «Reporte»— y no
 * cabían: «4 Pilares» se partía en dos renglones. Quedan tres.
 *
 * «Comunidad» es ahora la puerta a todo lo que publica la gente, en el orden en que se busca: las
 * publicaciones y los productos primero, las categorías después y al final las secciones. Tener
 * «Productos» como desplegable aparte separaba dos cosas que son lo mismo —lo que la comunidad
 * comparte— en dos menús que había que aprenderse por separado.
 *
 * «Reporte», que solo ven los administradores, vive en el menú del avatar.
 */
export default function Nav({
  categories,
}: {
  categories: readonly CategoryOption[];
}) {
  const t = useTranslations("nav");
  const tPillars = useTranslations("pillars");

  return (
    <NavigationMenu.Root
      className="relative z-20 flex justify-center"
      data-testid="desktop-menu"
    >
      <NavigationMenu.List className="center m-0 flex list-none rounded-full bg-white/50 dark:bg-black/50 px-2 py-1 shadow-xs backdrop-blur-xs">
        <NavigationMenu.Item>
          <SectionControl
            href={COMMUNITY_OVERVIEW_HREF}
            label={t("communityMenu")}
            openLabel={t("openSectionMenu", {
              section: t("communityMenu"),
            })}
          />
          <NavigationMenu.Content className="absolute top-0 left-0 w-auto">
            <div className="p-[22px] w-[300px] md:w-[600px]">
              {/* Lo que se vende va primero: es a lo que viene la mayoría. */}
              <ul className="m-0 grid list-none gap-x-[10px] grid-cols-1 md:grid-cols-2">
                <ListItem href="/" title={t("publications")}>
                  {t("publicationsDescription")}
                </ListItem>
                <ListItem href="/productos" title={t("brandProducts")}>
                  {t("brandProductsDescription", { brand: PUBLIC_BRAND_NAME })}
                </ListItem>
              </ul>

              {categories.length > 0 ? (
                <>
                  <hr className="my-3 border-gray-200 dark:border-gray-800" />
                  <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("byCategory")}
                  </p>
                  <ul className="m-0 grid list-none gap-x-[10px] grid-cols-2 md:grid-cols-3">
                    {categories.map((category) => (
                      <li key={category.value}>
                        <NavigationMenu.Link asChild>
                          <Link
                            href={{
                              pathname: "/categoria/[key]",
                              params: { key: category.value },
                            }}
                            className={CATEGORY_LINK_CLASS}
                          >
                            {category.label}
                          </Link>
                        </NavigationMenu.Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {/* Sin secciones publicadas no hay encabezado que pintar: un rótulo "Secciones"
                  seguido de nada es peor que no tenerlo. */}
              {VISIBLE_COMMUNITY_ITEMS.length > 0 ? (
                <>
                  <hr className="my-3 border-gray-200 dark:border-gray-800" />
                  <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("communitySections")}
                  </p>
                  <ul className="m-0 grid list-none gap-x-[10px] grid-cols-1 md:grid-cols-2">
                    {VISIBLE_COMMUNITY_ITEMS.map((item) => (
                      <ListItem
                        key={item.titleKey}
                        href={item.href}
                        title={t(item.titleKey)}
                      >
                        {t(item.descriptionKey, { brand: PUBLIC_BRAND_NAME })}
                      </ListItem>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <SectionControl
            href={PILLARS_OVERVIEW_HREF}
            label={t("pillarsMenu")}
            openLabel={t("openSectionMenu", { section: t("pillarsMenu") })}
          />
          <NavigationMenu.Content className="absolute top-0 left-0 w-auto">
            <ul className="m-0 grid list-none gap-x-[10px] p-[22px] w-[300px] md:w-[600px] lg:w-[700px] grid-cols-[1fr_1fr]">
              {PILLAR_ITEMS.map((item) => (
                <ListItem
                  key={item.titleKey}
                  href={item.href}
                  title={tPillars(item.titleKey)}
                >
                  {tPillars(item.descriptionKey)}
                </ListItem>
              ))}
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Link asChild>
            <Link href="/nosotros" className={LINK_CLASS}>
              {t("about")}
            </Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <div className="absolute top-full left-0 pt-2">
        <NavigationMenu.Viewport
          data-testid="desktop-submenu"
          className="data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut relative mt-[10px] h-(--radix-navigation-menu-viewport-height) w-(--radix-navigation-menu-viewport-width) origin-[top_center] overflow-hidden rounded-[10px] bg-white dark:bg-gray-900 shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] transition-[width,height] duration-300 border border-gray-200 dark:border-gray-800"
        />
      </div>
    </NavigationMenu.Root>
  );
}
