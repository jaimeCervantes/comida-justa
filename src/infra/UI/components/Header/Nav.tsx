"use client";
import { CaretDownIcon } from "@radix-ui/react-icons";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { Link } from "~/i18n/navigation";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import ListItem from "./ListItem";

export default function Nav({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <NavigationMenu.Root className="relative z-20 flex justify-center">
      <NavigationMenu.List className="center m-0 flex list-none rounded-full bg-white/50 dark:bg-black/50 px-2 py-1 shadow-xs backdrop-blur-xs">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className="text-gray-700 dark:text-gray-200 hover:text-pw-green focus:text-pw-green group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-hidden transition-colors">
            4 Pilares
            <CaretDownIcon
              className="text-pw-green relative top-px transition-transform duration-[250] ease-in group-data-[state=open]:-rotate-180"
              aria-hidden
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="absolute top-0 left-0 w-auto">
            <ul className="m-0 grid list-none gap-x-[10px] p-[22px] w-[300px] md:w-[600px] lg:w-[700px] grid-cols-[1fr_1fr]">
              <ListItem href="/pilares/sueno" title="Sueño y Descanso">
                Optimizar la higiene del sueño para tu recuperación biológica
              </ListItem>
              <ListItem
                href="/pilares/alimentacion"
                title="Alimentación natural y nutritiva"
              >
                Conexión con el origen, alimentos locales y reales
              </ListItem>
              <ListItem
                href="/pilares/movimiento"
                title="Ejercicio y Movimiento"
              >
                Combatir el sedentarismo con actividad física funcional
              </ListItem>
              <ListItem
                href="/pilares/mente-espiritu"
                title="Emociones, Mente, Espíritu y Comunidad"
              >
                Gestión emocional, mental y una clara conexión con los demás
              </ListItem>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className="text-gray-700 dark:text-gray-200 hover:text-pw-green focus:text-pw-green group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-hidden transition-colors">
            Comunidad
            <CaretDownIcon
              className="text-pw-green relative top-px transition-transform duration-[250] ease-in group-data-[state=open]:-rotate-180"
              aria-hidden
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="absolute top-0 left-0 w-auto">
            <ul className="m-0 grid list-none gap-[10px] p-[22px] w-[300px] md:w-[600px] grid-cols-2">
              <ListItem title="Grupos" href="/habitos/grupos">
                Grupos locales, donde te apoyan a alcanzar tus metas
              </ListItem>
              <ListItem href="/salud-infantil" title="Salud infantil">
                Es injusto fomentar una alimentación dañina
              </ListItem>
              <ListItem href="/medio-ambiente" title="Medio ambiente">
                Impacto para las generaciones futuras
              </ListItem>
              <ListItem title="Productores locales" href="/productores-locales">
                Apoyo a la producción local
              </ListItem>
              <ListItem title="Negocios locales" href="/negocios-locales">
                Guía a negocios locales de {PUBLIC_BRAND_NAME}
              </ListItem>
              <ListItem title="Deportes" href="/deportes">
                Dónde practicar deportes con personas que te animan
              </ListItem>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Link asChild>
            <Link
              href="/nosotros"
              className="text-gray-700 dark:text-gray-200 hover:text-pw-green focus:text-pw-green block select-none rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-hidden transition-colors"
            >
              Nosotros
            </Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Link asChild>
            <Link
              href="/productos"
              className="text-gray-700 dark:text-gray-200 hover:text-pw-green focus:text-pw-green block select-none rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-hidden transition-colors"
            >
              Productos
            </Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item>

        {isAdmin && (
          <NavigationMenu.Item>
            <NavigationMenu.Link asChild>
              <Link
                href="/admin/productos"
                className="text-gray-700 dark:text-gray-200 hover:text-pw-green focus:text-pw-green block select-none rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-hidden transition-colors"
              >
                Reporte
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
