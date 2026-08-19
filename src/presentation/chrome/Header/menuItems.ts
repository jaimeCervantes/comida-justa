import type { AppHref } from "~/i18n/navigation";

/**
 * Las entradas del menú, compartidas por el menú de escritorio (`Nav`) y el de móvil (`MobileNav`).
 *
 * Las claves de traducción se escriben **enteras y literales**, no se arman concatenando
 * (`t(\`community.\${key}.title\`)`): una clave que no se puede encontrar con grep es una clave que
 * se pierde en la siguiente limpieza. Escritas así, además, el tipado de next-intl las verifica.
 *
 * El destino ya no es una cadena (`"/pilares/sueno"`) sino un `href` de next-intl. Estas secciones
 * son rutas catch-all (`/pilares/[[...slug]]`), así que el segmento viaja en `params`, y así la
 * dirección se traduce sola: `/pilares/sueno` en español y `/en/pillars/sueno` en inglés.
 */

export const PILLAR_ITEMS = [
  {
    href: { pathname: "/pilares/[[...slug]]", params: { slug: ["sueno"] } },
    titleKey: "sleep.title",
    descriptionKey: "sleep.description",
  },
  {
    href: {
      pathname: "/pilares/[[...slug]]",
      params: { slug: ["alimentacion"] },
    },
    titleKey: "nutrition.title",
    descriptionKey: "nutrition.description",
  },
  {
    href: {
      pathname: "/pilares/[[...slug]]",
      params: { slug: ["movimiento"] },
    },
    titleKey: "movement.title",
    descriptionKey: "movement.description",
  },
  {
    href: {
      pathname: "/pilares/[[...slug]]",
      params: { slug: ["mente-espiritu"] },
    },
    titleKey: "mindSpirit.title",
    descriptionKey: "mindSpirit.description",
  },
] as const satisfies ReadonlyArray<{
  href: AppHref;
  titleKey: string;
  descriptionKey: string;
}>;

export const COMMUNITY_OVERVIEW_HREF = "/" as const satisfies AppHref;

/* La portada de los pilares se define en `~/i18n/routes`: el inicio también enlaza ahí y el literal
   de la ruta tiene que estar escrito en un solo sitio. Se reexporta para que el menú la siga
   importando de aquí, junto al resto de sus destinos. */
export { PILLARS_OVERVIEW_HREF } from "~/i18n/routes";

/**
 * Las seis secciones de «Comunidad», **con el interruptor de si ya existen**.
 *
 * Las seis rutas son hoy stubs que llaman a `notFound()`, así que enlazarlas desde el header
 * significaba seis 404 en **todas** las páginas del sitio: quien llega se topa con una puerta
 * cerrada y quien rastrea gasta ahí su presupuesto y pierde confianza en el resto.
 *
 * No se borran: la lista es el plan, y `docs/features/community/001-2026-08-02-secciones-comunidad.md` dice qué es cada una
 * y en qué orden se entregan. **Para publicar una, se pone su `published` en `true`** — y entonces
 * hay que acordarse de meterla al sitemap (`STATIC_SITEMAP_PATHS`), que es justo lo que recuerda
 * el escenario de `src/e2e/seo/seo.spec.ts` que afirma que estas rutas responden 404.
 */
export const COMMUNITY_ITEMS = [
  {
    href: { pathname: "/habitos/[[...slug]]", params: { slug: ["grupos"] } },
    titleKey: "community.groups.title",
    descriptionKey: "community.groups.description",
    published: false,
  },
  {
    href: { pathname: "/salud-infantil/[[...slug]]", params: { slug: [] } },
    titleKey: "community.childHealth.title",
    descriptionKey: "community.childHealth.description",
    published: false,
  },
  {
    href: { pathname: "/medio-ambiente/[[...slug]]", params: { slug: [] } },
    titleKey: "community.environment.title",
    descriptionKey: "community.environment.description",
    published: false,
  },
  {
    href: {
      pathname: "/productores-locales/[[...slug]]",
      params: { slug: [] },
    },
    titleKey: "community.localProducers.title",
    descriptionKey: "community.localProducers.description",
    published: true,
  },
  {
    href: { pathname: "/negocios-locales/[[...slug]]", params: { slug: [] } },
    titleKey: "community.localBusinesses.title",
    descriptionKey: "community.localBusinesses.description",
    published: true,
  },
  {
    href: { pathname: "/deportes/[[...slug]]", params: { slug: [] } },
    titleKey: "community.sports.title",
    descriptionKey: "community.sports.description",
    published: false,
  },
] as const satisfies ReadonlyArray<{
  href: AppHref;
  titleKey: string;
  descriptionKey: string;
  published: boolean;
}>;

/**
 * Lo que el menú pinta de verdad. Es la **única** lista que deben leer `Nav` y `MobileNav`: leer
 * `COMMUNITY_ITEMS` directamente volvería a enlazar lo que no existe.
 */
export const VISIBLE_COMMUNITY_ITEMS = COMMUNITY_ITEMS.filter(
  (item) => item.published,
);

/** Los 4 pilares en su forma corta, como los lista el pie. */
export const PILLAR_SHORT_KEYS = [
  "sleep.short",
  "nutrition.short",
  "movement.short",
  "mindSpirit.short",
] as const;
