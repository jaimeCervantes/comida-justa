"use client";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { CaretDownIcon } from "@radix-ui/react-icons";
import ListItem from "./ListItem";

export default function Nav() {
  return (
    <NavigationMenu.Root className="relative z-20 flex justify-center">
      <NavigationMenu.List className="center m-0 flex list-none rounded-full bg-white/50 dark:bg-black/50 px-2 py-1 shadow-sm backdrop-blur-sm">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className="text-gray-700 dark:text-gray-200 hover:text-pw-green focus:text-pw-green group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none transition-colors">
            Comida sana
            <CaretDownIcon
              className="text-pw-green relative top-[1px] transition-transform duration-[250] ease-in group-data-[state=open]:-rotate-180"
              aria-hidden
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="absolute top-0 left-0 w-auto">
            <ul className="m-0 grid list-none gap-x-[10px] p-[22px] w-[300px] md:w-[500px] lg:w-[600px] grid-cols-[0.75fr_1fr]">
              <ListItem href="/platillos" title="Platillos">
                Platillos locales con ingredientes locales
              </ListItem>
              <ListItem href="/frutas" title="Frutas">
                Frutas locales sin químicos
              </ListItem>
              <ListItem href="/verduras" title="Verduras">
                Verduras locales sin químicos
              </ListItem>
              <ListItem href="/semillas" title="Semillas">
                Semillas sin químicos
              </ListItem>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className="text-gray-700 dark:text-gray-200 hover:text-pw-green focus:text-pw-green group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none transition-colors">
            Comunidad
            <CaretDownIcon
              className="text-pw-green relative top-[1px] transition-transform duration-[250] ease-in group-data-[state=open]:-rotate-180"
              aria-hidden
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="absolute top-0 left-0 w-auto">
            <ul className="m-0 grid list-none gap-x-[10px] p-[22px] w-[300px] md:w-[600px] grid-flow-row md:grid-flow-col md:grid-rows-2">
              <ListItem title="Hábitos" href="/habitos">
                Hábitos saludables
              </ListItem>
              <ListItem title="Grupos" href="/habitos/grupos">
                Grupos locales, donde te apoyan a alcanzar tus metas
              </ListItem>
              <ListItem title="Deportes" href="/deportes">
                Dónde practicar deportes con personas que te animan
              </ListItem>
              <ListItem title="Aprendizaje" href="/aprendizaje">
                Cómo aprender más con hábitos saludables
              </ListItem>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className="text-gray-700 dark:text-gray-200 hover:text-pw-green focus:text-pw-green group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none transition-colors">
            Justicia
            <CaretDownIcon
              className="text-pw-green relative top-[1px] transition-transform duration-[250] ease-in group-data-[state=open]:-rotate-180"
              aria-hidden
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="absolute top-0 left-0 w-auto">
            <ul className="m-0 grid list-none gap-x-[10px] p-[22px] w-[300px] md:w-[500px] lg:w-[600px] grid-cols-[0.75fr_1fr]">
              <ListItem href="/salud-infantil" title="Salud infantil">
                Es injusto fomentar una alimentación dañina
              </ListItem>
              <ListItem href="/medio-ambiente" title="Medio ambiente">
                Impacto para las generaciones futuras
              </ListItem>
              <ListItem title="Productores" href="/productores-locales">
                Apoyo a la producción local
              </ListItem>
              <ListItem title="Negocios locales" href="/negocios-locales">
                Guía a negocios locales de comida justa
              </ListItem>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Indicator className="data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut top-full z-[1] flex h-[10px] items-end justify-center overflow-hidden transition-[width,transform_250ms_ease]">
          <div className="relative top-[70%] h-[10px] w-[10px] rotate-[45deg] rounded-tl-[2px] bg-white dark:bg-gray-900 border-t border-l border-gray-200 dark:border-gray-800" />
        </NavigationMenu.Indicator>
      </NavigationMenu.List>

      <div className="absolute top-full left-0 pt-2">
        <NavigationMenu.Viewport className="data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut relative mt-[10px] h-[var(--radix-navigation-menu-viewport-height)] w-[var(--radix-navigation-menu-viewport-width)] origin-[top_center] overflow-hidden rounded-[10px] bg-white dark:bg-gray-900 shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] transition-[width,_height] duration-300 border border-gray-200 dark:border-gray-800" />
      </div>
    </NavigationMenu.Root>
  );
}
