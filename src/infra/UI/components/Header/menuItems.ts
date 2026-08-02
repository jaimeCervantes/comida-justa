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

export const COMMUNITY_ITEMS = [
  {
    href: { pathname: "/habitos/[[...slug]]", params: { slug: ["grupos"] } },
    titleKey: "community.groups.title",
    descriptionKey: "community.groups.description",
  },
  {
    href: { pathname: "/salud-infantil/[[...slug]]", params: { slug: [] } },
    titleKey: "community.childHealth.title",
    descriptionKey: "community.childHealth.description",
  },
  {
    href: { pathname: "/medio-ambiente/[[...slug]]", params: { slug: [] } },
    titleKey: "community.environment.title",
    descriptionKey: "community.environment.description",
  },
  {
    href: {
      pathname: "/productores-locales/[[...slug]]",
      params: { slug: [] },
    },
    titleKey: "community.localProducers.title",
    descriptionKey: "community.localProducers.description",
  },
  {
    href: { pathname: "/negocios-locales/[[...slug]]", params: { slug: [] } },
    titleKey: "community.localBusinesses.title",
    descriptionKey: "community.localBusinesses.description",
  },
  {
    href: { pathname: "/deportes/[[...slug]]", params: { slug: [] } },
    titleKey: "community.sports.title",
    descriptionKey: "community.sports.description",
  },
] as const satisfies ReadonlyArray<{
  href: AppHref;
  titleKey: string;
  descriptionKey: string;
}>;

/** Los 4 pilares en su forma corta, como los lista el pie. */
export const PILLAR_SHORT_KEYS = [
  "sleep.short",
  "nutrition.short",
  "movement.short",
  "mindSpirit.short",
] as const;
