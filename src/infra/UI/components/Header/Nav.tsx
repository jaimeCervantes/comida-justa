"use client";
import { CaretDownIcon } from "@radix-ui/react-icons";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { useTranslations } from "next-intl";
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

export default function Nav({ isAdmin = false }: { isAdmin?: boolean }) {
  const t = useTranslations("nav");
  const tPillars = useTranslations("pillars");

  return (
    <NavigationMenu.Root className="relative z-20 flex justify-center">
      <NavigationMenu.List className="center m-0 flex list-none rounded-full bg-white/50 dark:bg-black/50 px-2 py-1 shadow-xs backdrop-blur-xs">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={TRIGGER_CLASS}>
            {t("pillarsMenu")}
            <CaretDownIcon className={CARET_CLASS} aria-hidden />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="absolute top-0 left-0 w-auto">
            <ul className="m-0 grid list-none gap-x-[10px] p-[22px] w-[300px] md:w-[600px] lg:w-[700px] grid-cols-[1fr_1fr]">
              {PILLAR_ITEMS.map((item) => (
                <ListItem
                  key={item.href}
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
                  key={item.href}
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

        <NavigationMenu.Item>
          <NavigationMenu.Link asChild>
            <Link href="/productos" className={LINK_CLASS}>
              {t("products")}
            </Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item>

        {isAdmin && (
          <NavigationMenu.Item>
            <NavigationMenu.Link asChild>
              <Link href="/admin/productos" className={LINK_CLASS}>
                {t("report")}
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        )}

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
