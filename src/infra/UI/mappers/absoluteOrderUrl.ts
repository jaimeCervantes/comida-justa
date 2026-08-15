import { type AppLocale, pathnames, routing } from "~/i18n/routing";
import { PUBLIC_BASE_URL } from "~/infra/constants";

/**
 * La dirección absoluta de un pedido, en el idioma en que se hizo.
 *
 * Sale de `pathnames` y no de una plantilla escrita a mano: la ruta **está traducida**
 * (`/pedido/[id]` y `/order/[id]`), así que un `${base}/pedido/${id}` mandaría al vendedor inglés a
 * una dirección que no existe. Y `localePrefix` es `as-needed`, así que el prefijo sólo lo lleva el
 * inglés.
 *
 * Se apoya en `PUBLIC_BASE_URL` y nunca en `window.location`, al revés que `createAbsoluteUrl`: esta
 * dirección viaja dentro de un mensaje de WhatsApp y la calculan tanto el servidor como el navegador
 * —la lista de pedidos es un componente de cliente—. Con el origen del navegador, el HTML del
 * servidor y el de la hidratación no coincidirían.
 */
export function absoluteOrderUrl(locale: AppLocale, id: string): string {
  const path = pathnames["/pedido/[id]"][locale].replace("[id]", id);
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  return `${PUBLIC_BASE_URL}${prefix}${path}`;
}
