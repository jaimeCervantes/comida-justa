import { absoluteUrl } from "./url";

export interface LocalizedAlternates {
  canonical: string;
  languages: Record<string, string>;
}

export interface LocalizedAlternatesInput {
  baseUrl: string;
  /** La dirección que ya resolvió cada idioma: `{ es: "/nosotros", en: "/en/about" }`. */
  pathByLocale: Readonly<Record<string, string>>;
  /** El idioma que se está sirviendo: el que se lleva el canónico. */
  locale: string;
  /** El idioma que atiende a quien no pidió ninguno: el que se lleva `x-default`. */
  defaultLocale: string;
}

/**
 * El canónico de una página traducida y las direcciones de sus hermanas.
 *
 * **Cada idioma es canónico de sí mismo.** Hasta ahora el home, `/nosotros`, `/productos` y los
 * pilares fijaban el canónico en español desde cualquier idioma, así que `/en/about` —que está
 * traducida de verdad— le pedía al buscador que la ignorara, mientras `/en/category/panaderia` sí
 * se canonizaba a sí misma. Dos criterios opuestos en el mismo sitio. El que vale es este: si la
 * página existe en los dos idiomas, cada versión es la buena en el suyo, y `hreflang` explica que
 * son la misma cosa en vez de dejar que parezcan duplicados.
 *
 * `x-default` apunta al idioma por defecto porque es lo que se sirve sin prefijo, que es lo que ve
 * quien llega sin pedir idioma.
 *
 * **Esto no vale para el detalle de una publicación**, que solo existe en español: ahí `/en/<slug>`
 * es el mismo texto español con el marco en inglés, y su canónico sigue apuntando al español.
 */
export function buildLocalizedAlternates({
  baseUrl,
  pathByLocale,
  locale,
  defaultLocale,
}: LocalizedAlternatesInput): LocalizedAlternates {
  const urlFor = (candidate: string): string | undefined => {
    const path = pathByLocale[candidate];

    return path ? absoluteUrl(baseUrl, path) : undefined;
  };

  const languages = Object.fromEntries(
    Object.entries(pathByLocale).map(([code, path]) => [
      code,
      absoluteUrl(baseUrl, path),
    ]),
  );
  const defaultUrl = urlFor(defaultLocale);

  return {
    canonical: urlFor(locale) ?? defaultUrl ?? absoluteUrl(baseUrl, "/"),
    languages: defaultUrl
      ? { ...languages, "x-default": defaultUrl }
      : languages,
  };
}
