import { absoluteUrl } from "./url";

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
}

export interface SitemapContent {
  /**
   * Una entrada **por traducción**, no por publicación: cada idioma tiene su propio slug y su
   * propio texto, así que son dos páginas distintas y no una duplicada.
   */
  posts: Array<{ slug: string; locale: string; lastModified?: Date | null }>;
  stores: Array<{ handle: string; lastModified?: Date | null }>;
  profiles: Array<{ username: string }>;
  /**
   * **Solo las categorías que tienen publicaciones.** Una categoría vacía responde 200 con una
   * lista vacía: publicarla sería ofrecerle al buscador una página hueca por cada clave del
   * catálogo. Hoy son 6 de 10.
   */
  categories: Array<{ key: string }>;
  /**
   * Las secciones del menú que **ya tienen contenido**. Misma regla que las categorías: una
   * sección vacía existe a propósito —está en el menú y se llenará— pero no es contenido.
   */
  sections: Array<{ path: string }>;
}

/**
 * Las páginas fijas que existen de verdad.
 *
 * **No están las seis secciones del menú que responden 404** (`habitos`, `deportes`,
 * `medio-ambiente`, `negocios-locales`, `salud-infantil`, `productores-locales`): hoy son stubs
 * que llaman a `notFound()`, y publicar un 404 en el sitemap es la forma más rápida de perder
 * confianza con un rastreador. Cuando tengan contenido, se agregan aquí.
 */
export const STATIC_SITEMAP_PATHS: readonly string[] = [
  "/",
  "/productos",
  "/nosotros",
  "/pilares",
  "/pilares/sueno",
  "/pilares/alimentacion",
  "/pilares/movimiento",
  "/pilares/mente-espiritu",
  "/politica-de-privacidad",
  "/condiciones-de-servicio",
];

/**
 * Arma el sitemap a partir de lo que existe.
 *
 * **Las publicaciones se listan en todos los idiomas en los que existen de verdad.** Antes solo el
 * español, y con razón: `/en/<slug>` habría servido el mismo texto español con el marco en inglés,
 * o sea una página duplicada y delgada. Desde el backfill de traducciones cada idioma tiene su
 * propio slug y su propio texto, así que son dos páginas y las dos merecen estar.
 *
 * El prefijo lo pone `localePrefix: as-needed`: el idioma por defecto vive sin él.
 *
 * **Sin `priority` ni `changeFrequency`:** Google dice explícitamente que los ignora. Lo que sí
 * usa es `lastModified`, así que eso es lo único que se calcula, y solo cuando la base lo sabe.
 */
export function buildSitemap(
  baseUrl: string,
  content: SitemapContent,
  defaultLocale: string,
): SitemapEntry[] {
  const absolute = (path: string): string => absoluteUrl(baseUrl, path);
  const localized = (path: string, locale: string): string =>
    absolute(locale === defaultLocale ? path : `/${locale}${path}`);

  const staticEntries = STATIC_SITEMAP_PATHS.map((path) => ({
    url: absolute(path),
  }));

  const postEntries = content.posts.map((post) => ({
    url: localized(`/${post.slug}`, post.locale),
    ...withLastModified(post.lastModified),
  }));

  const storeEntries = content.stores.map((store) => ({
    url: absolute(`/tienda/${store.handle}`),
    ...withLastModified(store.lastModified),
  }));

  const profileEntries = content.profiles.map((profile) => ({
    url: absolute(`/u/${profile.username}`),
  }));

  const categoryEntries = content.categories.map((category) => ({
    url: absolute(`/categoria/${category.key}`),
  }));

  const sectionEntries = content.sections.map((section) => ({
    url: absolute(section.path),
  }));

  return [
    ...staticEntries,
    ...postEntries,
    ...storeEntries,
    ...profileEntries,
    ...categoryEntries,
    ...sectionEntries,
  ];
}

function withLastModified(value: Date | null | undefined): {
  lastModified?: Date;
} {
  return value ? { lastModified: value } : {};
}
