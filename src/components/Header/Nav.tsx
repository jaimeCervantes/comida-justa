"use client";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { CaretDownIcon } from "@radix-ui/react-icons";
import ListItem from "./ListItem";

export default function Nav() {
  return (
    <NavigationMenu.Root className="flex justify-center">
      <NavigationMenu.List className="center m-0 flex list-none rounded-[6px] bg-white dark:bg-pw-gray p-1">
        <NavigationMenu.Item className="dark:bg-pw-gray">
          <NavigationMenu.Trigger className="text-pw-green mr-1 hover:bg-violet3 focus:shadow-violet7 group flex select-none items-center justify-between gap-[2px] rounded-[2px] px-3 py-4 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_1px]">
            Comida sana
            <CaretDownIcon
              className="pw-green  relative top-[1px] transition-transform duration-[250] ease-in group-data-[state=open]:-rotate-180"
              aria-hidden
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="dark:bg-pw-gray data-[motion=from-start]:animate-enterFromLeft data-[motion=from-end]:animate-enterFromRight data-[motion=to-start]:animate-exitToLeft data-[motion=to-end]:animate-exitToRight absolute top-0 left-0 w-full sm:w-auto">
            <ul className="dark:bg-pw-gray one m-0 grid list-none gap-x-[10px] p-[22px] sm:w-[500px] sm:grid-cols-[0.75fr_1fr]">
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

        <NavigationMenu.Item className="dark:bg-pw-gray">
          <NavigationMenu.Trigger className="text-pw-green mr-1 hover:bg-violet3 focus:shadow-violet7 group flex select-none items-center justify-between gap-[2px] rounded-[2px] px-3 py-4 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_1px]">
            Comunidad
            <CaretDownIcon
              className="pw-green  relative top-[1px] transition-transform duration-[250] ease-in group-data-[state=open]:-rotate-180"
              aria-hidden
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="dark:bg-pw-gray absolute top-0 left-0 w-full sm:w-auto">
            <ul className="m-0 grid list-none gap-x-[10px] p-[22px] sm:w-[600px] sm:grid-flow-col sm:grid-rows-2">
              <ListItem title="Hábitos" href="/habitos">
                Hábitos saludables
              </ListItem>
              <ListItem title="Grupos" href="/habitos/grupos">
                Grupos locales, donde te apoyan a alcanzar tus metas de salud y
                bienestar
              </ListItem>
              <ListItem title="Deportes" href="/deportes">
                Dónde practicar deportes con personas que te animan y no te
                dejan solo
              </ListItem>
              <ListItem title="Aprendizaje" href="/aprendizaje">
                Cómo aprender más con hábitos saludables
              </ListItem>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item className="dark:bg-pw-gray">
          <NavigationMenu.Trigger className="text-pw-green  hover:bg-violet3 focus:shadow-violet7 group flex select-none items-center justify-between gap-[2px] rounded-[2px] px-3 py-4 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_1px]">
            Justicia
            <CaretDownIcon
              className="pw-green  relative top-[1px] transition-transform duration-[250] ease-in group-data-[state=open]:-rotate-180"
              aria-hidden
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="dark:bg-pw-gray data-[motion=from-start]:animate-enterFromLeft data-[motion=from-end]:animate-enterFromRight data-[motion=to-start]:animate-exitToLeft data-[motion=to-end]:animate-exitToRight absolute top-0 left-0 w-full sm:w-auto">
            <ul className="dark:bg-pw-gray one m-0 grid list-none gap-x-[10px] p-[22px] sm:w-[500px] sm:grid-cols-[0.75fr_1fr]">
              <ListItem href="/salud-infantil" title="Salud infantil">
                Es injusto fomentar una alimentación que les provocará
                enfermedades a los niños
              </ListItem>
              <ListItem href="/medio-ambiente" title="Medio ambiente">
                Nuestras actividades diarias generan un impacto ambiental
                negativo, es hora de pensar en los demás.
              </ListItem>
              <ListItem title="Productores" href="/productores-locales">
                Grupos de personas para el apoyo a la producción local
              </ListItem>
              <ListItem title="Negocios locales" href="/negocios-locales">
                Apoyo, guía a negocios locales que fomentan la comida justa
              </ListItem>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Indicator className="data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut top-full z-[1] flex h-[10px] items-end justify-center overflow-hidden transition-[width,transform_250ms_ease]">
          <div className="relative top-[70%] h-[10px] w-[10px] rotate-[45deg] rounded-tl-[2px] bg-white dark:bg-pw-gray" />
        </NavigationMenu.Indicator>
      </NavigationMenu.List>

      <div className="perspective-[2000px] absolute top-full left-0 flex w-full justify-center sm:justify-start">
        <NavigationMenu.Viewport className="data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut relative mt-[10px] h-[var(--radix-navigation-menu-viewport-height)] w-full origin-[top_center] overflow-hidden rounded-[6px] bg-white dark:bg-pw-gray transition-[width,_height] duration-300 sm:w-[var(--radix-navigation-menu-viewport-width)]" />
      </div>
    </NavigationMenu.Root>
  );
}
