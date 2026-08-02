"use client";
import { CaretDownIcon } from "@radix-ui/react-icons";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { useTranslations } from "next-intl";
import type { CategoryOption } from "~/domain/entities/post/taxonomy";
import { Link } from "~/i18n/navigation";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import ListItem from "./ListItem";
import { COMMUNITY_ITEMS, PILLAR_ITEMS } from "./menuItems";

const TRIGGER_CLASS =
  "text-gray-700 dark:text-gray-200 hover:text-pw-green focus:text-pw-green group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-hidden transition-colors";

const LINK_CLASS =
  "text-gray-700 dark:text-gray-200 hover:text-pw-green focus:text-pw-green block select-none rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-hidden transition-colors";

const CARET_CLASS =
  "text-pw-green relative top-px transition-transform duration-[250] ease-in group-data-[state=open]:-rotate-180";

/** Enlace de una categoría dentro del desplegable: solo la etiqueta, sin descripción. */
const CATEGORY_LINK_CLASS =
  "text-gray-700 dark:text-gray-200 hover:bg-mauve3 hover:text-pw-green block select-none rounded-[6px] px-3 py-2 text-[15px] leading-none no-underline outline-hidden transition-colors";

/**
 * La barra principal.
 *
 * Antes tenía cinco elementos —«4 Pilares», «Comunidad», «Nosotros», «Productos» y «Reporte»— y no
 * cabían: «4 Pilares» se partía en dos renglones. Ahora todo lo que es catálogo cuelga de un solo
 * desplegable, «Productos», donde además viven las categorías; y «Reporte», que solo ven los
 * administradores, se fue al menú de la cuenta.
 */
export default function Nav({
  categories,
}: {
  categories: readonly CategoryOption[];
}) {
  const t = useTranslations("nav");
  const tPillars = useTranslations("pillars");

  return (
    <NavigationMenu.Root className="relative z-20 flex justify-center">
      <NavigationMenu.List className="center m-0 flex list-none rounded-full bg-white/50 dark:bg-black/50 px-2 py-1 shadow-xs backdrop-blur-xs">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={TRIGGER_CLASS}>
            {t("productsMenu")}
            <CaretDownIcon className={CARET_CLASS} aria-hidden />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="absolute top-0 left-0 w-auto">
            <div className="p-[22px] w-[300px] md:w-[460px]">
              <ul className="m-0 grid list-none gap-x-[10px] grid-cols-1 md:grid-cols-2">
                <ListItem href="/" title={t("wholeCatalog")}>
                  {t("wholeCatalogDescription")}
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
                  <ul className="m-0 grid list-none gap-x-[10px] grid-cols-2">
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
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={TRIGGER_CLASS}>
            {t("pillarsMenu")}
            <CaretDownIcon className={CARET_CLASS} aria-hidden />
          </NavigationMenu.Trigger>
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
          <NavigationMenu.Trigger className={TRIGGER_CLASS}>
            {t("communityMenu")}
            <CaretDownIcon className={CARET_CLASS} aria-hidden />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="absolute top-0 left-0 w-auto">
            <ul className="m-0 grid list-none gap-[10px] p-[22px] w-[300px] md:w-[600px] grid-cols-2">
              {COMMUNITY_ITEMS.map((item) => (
                <ListItem
                  key={item.titleKey}
                  href={item.href}
                  title={t(item.titleKey)}
                >
                  {t(item.descriptionKey, { brand: PUBLIC_BRAND_NAME })}
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

        <NavigationMenu.Indicator className="data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut top-full z-1 flex h-[10px] items-end justify-center overflow-hidden transition-[width,transform_250ms_ease]">
          <div className="relative top-[70%] h-[10px] w-[10px] rotate-45 rounded-tl-[2px] bg-white dark:bg-gray-900 border-t border-l border-gray-200 dark:border-gray-800" />
        </NavigationMenu.Indicator>
      </NavigationMenu.List>
      <div className="absolute top-full left-0 pt-2">
        <NavigationMenu.Viewport className="data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut relative mt-[10px] h-(--radix-navigation-menu-viewport-height) w-(--radix-navigation-menu-viewport-width) origin-[top_center] overflow-hidden rounded-[10px] bg-white dark:bg-gray-900 shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] transition-[width,height] duration-300 border border-gray-200 dark:border-gray-800" />
      </div>
    </NavigationMenu.Root>
  );
}
