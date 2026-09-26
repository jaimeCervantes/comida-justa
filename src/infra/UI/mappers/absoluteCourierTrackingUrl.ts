import { type AppLocale, pathnames, routing } from "~/i18n/routing";
import { PUBLIC_BASE_URL } from "~/infra/constants";

/**
 * El enlace del repartidor, en el idioma en que el vendedor lo comparte.
 *
 * Mismo criterio que `absoluteOrderUrl`: sale de `pathnames` y no de una plantilla escrita a mano,
 * y se apoya en `PUBLIC_BASE_URL` porque este enlace viaja por WhatsApp, fuera del navegador que lo
 * generó.
 */
export function absoluteCourierTrackingUrl(
  locale: AppLocale,
  orderId: string,
  token: string,
): string {
  const path = pathnames["/pedido/[id]/repartidor/[token]"][locale]
    .replace("[id]", orderId)
    .replace("[token]", token);
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  return `${PUBLIC_BASE_URL}${prefix}${path}`;
}
