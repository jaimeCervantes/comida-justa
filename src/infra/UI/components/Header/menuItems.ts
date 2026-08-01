/**
 * Las entradas del menú, compartidas por el menú de escritorio (`Nav`) y el de móvil (`MobileNav`).
 *
 * Las claves de traducción se escriben **enteras y literales**, no se arman concatenando
 * (`t(\`community.\${key}.title\`)`): una clave que no se puede encontrar con grep es una clave que
 * se pierde en la siguiente limpieza. Escritas así, además, el tipado de next-intl las verifica.
 */

export const PILLAR_ITEMS = [
  {
    href: "/pilares/sueno",
    titleKey: "sleep.title",
    descriptionKey: "sleep.description",
  },
  {
    href: "/pilares/alimentacion",
    titleKey: "nutrition.title",
    descriptionKey: "nutrition.description",
  },
  {
    href: "/pilares/movimiento",
    titleKey: "movement.title",
    descriptionKey: "movement.description",
  },
  {
    href: "/pilares/mente-espiritu",
    titleKey: "mindSpirit.title",
    descriptionKey: "mindSpirit.description",
  },
] as const;

export const COMMUNITY_ITEMS = [
  {
    href: "/habitos/grupos",
    titleKey: "community.groups.title",
    descriptionKey: "community.groups.description",
  },
  {
    href: "/salud-infantil",
    titleKey: "community.childHealth.title",
    descriptionKey: "community.childHealth.description",
  },
  {
    href: "/medio-ambiente",
    titleKey: "community.environment.title",
    descriptionKey: "community.environment.description",
  },
  {
    href: "/productores-locales",
    titleKey: "community.localProducers.title",
    descriptionKey: "community.localProducers.description",
  },
  {
    href: "/negocios-locales",
    titleKey: "community.localBusinesses.title",
    descriptionKey: "community.localBusinesses.description",
  },
  {
    href: "/deportes",
    titleKey: "community.sports.title",
    descriptionKey: "community.sports.description",
  },
] as const;

/** Los 4 pilares en su forma corta, como los lista el pie. */
export const PILLAR_SHORT_KEYS = [
  "sleep.short",
  "nutrition.short",
  "movement.short",
  "mindSpirit.short",
] as const;
