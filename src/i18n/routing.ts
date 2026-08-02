import { hasLocale } from "next-intl";
import { defineRouting } from "next-intl/routing";

/**
 * Las direcciones visibles de cada idioma.
 *
 * **La clave es la ruta interna, o sea el nombre real de la carpeta bajo `src/app/[locale]/`,
 * que se queda en español.** La referencia (`EVS-order-RFID`) usa claves en inglés y renombra las
 * carpetas; aquí se decidió no hacerlo (2026-08-01): las URL visibles quedan idénticas de las dos
 * maneras y el type-check de `href` lo da declarar `pathnames`, no el idioma de las claves, así
 * que mover ~10 carpetas con sus imports no compraba nada. Si algún día se renombran, es un
 * refactor aparte que no cambia ninguna dirección.
 *
 * **El español no cambia nunca.** Sus URL ya están repartidas e indexadas; lo único que se añade
 * es la lectura en inglés.
 *
 * Los segmentos dinámicos de publicación (`[slug]`) **no se traducen todavía**: el slug sale de
 * `post_translations.slug`, y hoy hay 24 filas en español y 0 en inglés. Cuando los slices 2 y 3
 * llenen esas filas, el slug en inglés entra sin tocar este archivo.
 */
export const pathnames = {
  "/": "/",

  // El marco del sitio: su interfaz ya está traducida (slice 1), así que su URL puede estarlo.
  "/nosotros": { es: "/nosotros", en: "/about" },
  "/productos": { es: "/productos", en: "/products" },
  "/productos/page/[page]": {
    es: "/productos/page/[page]",
    en: "/products/page/[page]",
  },
  "/publicar": { es: "/publicar", en: "/publish" },
  "/cuenta": { es: "/cuenta", en: "/account" },
  "/buscar": { es: "/buscar", en: "/search" },
  "/buscar/[term]/page/[page]": {
    es: "/buscar/[term]/page/[page]",
    en: "/search/[term]/page/[page]",
  },
  "/condiciones-de-servicio": {
    es: "/condiciones-de-servicio",
    en: "/terms-of-service",
  },
  "/politica-de-privacidad": {
    es: "/politica-de-privacidad",
    en: "/privacy-policy",
  },

  // Las cuatro secciones de contenido y los pilares.
  "/pilares/[[...slug]]": {
    es: "/pilares/[[...slug]]",
    en: "/pillars/[[...slug]]",
  },
  "/habitos/[[...slug]]": {
    es: "/habitos/[[...slug]]",
    en: "/habits/[[...slug]]",
  },
  "/deportes/[[...slug]]": {
    es: "/deportes/[[...slug]]",
    en: "/sports/[[...slug]]",
  },
  "/medio-ambiente/[[...slug]]": {
    es: "/medio-ambiente/[[...slug]]",
    en: "/environment/[[...slug]]",
  },
  "/salud-infantil/[[...slug]]": {
    es: "/salud-infantil/[[...slug]]",
    en: "/child-health/[[...slug]]",
  },
  "/negocios-locales/[[...slug]]": {
    es: "/negocios-locales/[[...slug]]",
    en: "/local-businesses/[[...slug]]",
  },
  "/productores-locales/[[...slug]]": {
    es: "/productores-locales/[[...slug]]",
    en: "/local-producers/[[...slug]]",
  },

  // Tienda y edición: la dirección se traduce, el slug que la sigue no.
  "/tienda/[slug]": { es: "/tienda/[slug]", en: "/store/[slug]" },
  "/tienda/[slug]/page/[page]": {
    es: "/tienda/[slug]/page/[page]",
    en: "/store/[slug]/page/[page]",
  },
  "/editar/[slug]": { es: "/editar/[slug]", en: "/edit/[slug]" },

  "/admin/catalogo": { es: "/admin/catalogo", en: "/admin/catalog" },
  "/admin/productos": { es: "/admin/productos", en: "/admin/products" },

  /* Iguales en los dos idiomas, cada una por su motivo:
     - `/[slug]` y `/page/[page]` son la publicación y la paginación del inicio; el slug se queda
       en español hasta que exista su traducción.
     - `/u/[username]` lleva un identificador que la persona eligió: traducirlo no significa nada.
     - `/auth/signin` la dicta NextAuth, no este routing. */
  "/[slug]": "/[slug]",
  "/page/[page]": "/page/[page]",
  "/u/[username]": "/u/[username]",
  "/u/[username]/page/[page]": "/u/[username]/page/[page]",
  "/auth/signin": "/auth/signin",
} as const;

export const routing = defineRouting({
  locales: ["es", "en"],
  // Used when no locale matches
  defaultLocale: "es",
  /* `as-needed` deja el español sin prefijo (`/productos`) y solo prefija el inglés (`/en/…`).
     No se cambia a `always`: las URL en español ya están repartidas e indexadas, y moverlas a
     `/es/…` rompería enlaces. Ver `docs/features/i18n.md`, "Lo que no se copia". */
  localePrefix: "as-needed",
  pathnames,
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
