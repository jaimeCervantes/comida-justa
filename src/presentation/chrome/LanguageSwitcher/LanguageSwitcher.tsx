"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "~/i18n/navigation";
import { type AppLocale, routing } from "~/i18n/routing";
import { Button } from "~/presentation/design_system/buttons/Button";
import { ChevronDown } from "~/presentation/design_system/icons/ChevronDown";
import {
  MENU_CONTENT_CLASS,
  MENU_ITEM_CLASS,
} from "~/presentation/design_system/styling/menuSurface";
import { cn } from "~/presentation/design_system/styling/merge-class-names";

const localesMap: Record<AppLocale, { label: string; flag: string }> = {
  // i18n-ignore: el nombre de un idioma se escribe en ese idioma, también en la interfaz en inglés.
  es: { label: "Español", flag: "🇲🇽" },
  en: { label: "English", flag: "🇺🇸" },
};

const locales = routing.locales.map((code) => ({ code, ...localesMap[code] }));

/**
 * El selector de idioma de la cabecera.
 *
 * Sobre Radix, como el menú del avatar y el de compartir. Estaba escrito a mano con un `useState`,
 * y un desplegable a mano no escucha nada fuera de sí mismo: tocar en cualquier otra parte no lo
 * cerraba —tampoco Escape—, así que el panel se quedaba encima del contenido hasta volver a pulsar
 * su propio botón. Eso no se arregla con un `onClick` en el documento: hay que devolver el foco a
 * donde estaba, cerrar al elegir, no cerrarse al desplazarse dentro y anunciarse como menú. Todo
 * eso ya lo trae la primitiva que la barra usa dos veces más.
 */
export default function LanguageSwitcher() {
  /* `usePathname` de `~/i18n/navigation` devuelve la ruta **sin** el prefijo de idioma, así que
     cambiar de idioma es volver a pedir la misma ruta con otro locale. Antes esto era cirugía de
     strings sobre la ruta cruda (`pathname.replace("/es", "/en")`), que se rompía con cualquier
     ruta que contuviera el código de idioma en otra posición. */
  const t = useTranslations("nav");
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const currentLocale = useLocale();

  const handleChange = (newLocale: AppLocale) => {
    /* Desde que hay `pathnames`, cambiar de idioma es traducir la ruta actual, y una ruta con
       segmentos dinámicos (`/tienda/[slug]`) necesita además sus valores. Por eso viaja `params`:
       sin él, quien esté viendo una tienda acabaría en el inicio del otro idioma.

       El `ts-expect-error` es el que documenta next-intl para este caso: el tipo exige que los
       `params` casen con *ese* `pathname` concreto, y aquí ambos salen de la ruta que ya se está
       mostrando, así que casan por construcción — pero el compilador no puede probarlo. */
    router.replace(
      // @ts-expect-error -- `pathname` y `params` vienen de la ruta activa, así que coinciden.
      { pathname, params },
      { locale: newLocale },
    );
  };

  const current = locales.find((l) => l.code === currentLocale) ?? locales[0];

  return (
    /* `modal={false}` no es un detalle: en modo modal —el de por omisión— Radix pone
       `pointer-events: none` en el `body` y `aria-hidden` en el resto de la página mientras el menú
       está abierto. El menú se cierra al tocar fuera, sí, pero **ese toque se pierde**: tocar un
       enlace con el menú abierto lo cierra y no lleva a ninguna parte, así que hay que tocar dos
       veces. Un desplegable de una barra no es un diálogo: no reclama la pantalla. */
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        {/* `aria-expanded` y `aria-haspopup` los pone Radix en el disparador: eran dos atributos
            que había que acordarse de sincronizar con el `useState` a mano. */}
        {/* Blanco con borde, como el 5.1. Era `color="black"`: un rectángulo negro en la esquina
            del header pesa más que la acción principal, y el idioma es lo último que alguien
            cambia. El borde es lo que lo mantiene identificable como control sin rellenarlo. */}
        <Button
          color="white"
          size="xs"
          aria-label={t("changeLanguage")}
          /* `group` para que la flecha pueda mirar el `data-state` que Radix escribe aquí. */
          className="group border border-separator"
        >
          <span className="text-sm">{current.flag}</span>
          {/* Era un `▼` de texto: su tamaño y su grosor los decidía la fuente que resolviera el
              sistema, así que no casaba con la del desplegable de los formularios. Ahora es la
              misma, y girarla es lo que ahorra el segundo glifo (`▲`). Gira con el estado que
              publica el disparador, no con una copia del estado en React. */}
          <ChevronDown className="size-4 transition-transform duration-fast ease-standard group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        {/* Con nombre propio, igual que `user-menu`: es lo que una prueba abre y espera ver
            desaparecer. */}
        <DropdownMenu.Content
          align="end"
          /* Hacia arriba: desde el 5.16 este conmutador vive en el pie, y un desplegable que se
             abre hacia abajo desde el final de la página nace fuera de la pantalla. Se descubrió
             porque el escenario que cambia a inglés se quedó colgado en el clic. */
          side="top"
          /* Se voltea solo si arriba tampoco cabe: `side` es la preferencia, no una imposición. */
          avoidCollisions
          sideOffset={8}
          className={MENU_CONTENT_CLASS}
          data-testid="language-menu"
        >
          {locales.map((locale) => (
            <DropdownMenu.Item
              key={locale.code}
              onSelect={() => handleChange(locale.code)}
              className={cn(
                MENU_ITEM_CLASS,
                "flex items-center",
                locale.code === currentLocale &&
                  "bg-surface-elevation-2 font-semibold text-text-base",
              )}
            >
              <span className="mr-2 text-lg">{locale.flag}</span>
              {locale.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
