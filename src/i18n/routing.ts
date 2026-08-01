import { hasLocale } from "next-intl";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  // Used when no locale matches
  defaultLocale: "es",
  /* `as-needed` deja el español sin prefijo (`/productos`) y solo prefija el inglés (`/en/…`).
     No se cambia a `always`: las URL en español ya están repartidas e indexadas, y moverlas a
     `/es/…` rompería enlaces. Ver `docs/features/i18n.md`, "Lo que no se copia". */
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];

/**
 * Reduce un segmento de ruta cualquiera a un idioma soportado.
 *
 * Next entrega `params.locale` como `string` porque el segmento acepta lo que sea, mientras que
 * todas las APIs de next-intl exigen un idioma conocido. Este es el **único** lugar donde ocurre
 * esa conversión: nunca un cast. Quien necesite rechazar un idioma desconocido en vez de caer al
 * español debe usar `hasLocale` + `notFound()`.
 */
export function resolveLocale(candidate: string | undefined): AppLocale {
  return hasLocale(routing.locales, candidate)
    ? candidate
    : routing.defaultLocale;
}
