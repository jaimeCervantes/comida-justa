/**
 * Qué traducción de una publicación se le enseña a quien la pidió.
 *
 * Hoy no existe esta decisión: nueve archivos leen `translations?.es` a mano —el mapper de
 * tarjetas, `PostDetail`, el `metadata`, el JSON-LD, la barra de búsqueda…—, así que una fila `en`
 * en la base sería **invisible** por mucho que existiera. Esto la centraliza en una sola regla:
 *
 *   el idioma pedido → si no existe, el de respaldo → si tampoco, cualquiera que haya.
 *
 * El último escalón importa: una publicación con traducción solo en un tercer idioma se muestra en
 * ese, porque enseñar algo es mejor que enseñar un hueco. Lo que nunca hace es inventarse texto.
 */

export interface PostTranslation {
  locale: string;
  title: string;
  slug: string;
  content: string;
}

export interface ResolvedTranslation extends PostTranslation {
  /**
   * `true` cuando el idioma pedido no existía y hubo que caer a otro.
   *
   * Se publica en el resultado y no se resuelve en silencio a propósito: el criterio de aceptación
   * del slice dice que el respaldo tiene que ser **visible o declarado**, no un silencio. Quien
   * pinta decide si lo dice; quien resuelve tiene la obligación de contarlo.
   */
  isFallback: boolean;
}

/** La forma laxa en la que la traducción llega desde infraestructura. */
type RawTranslations =
  | Record<string, Partial<PostTranslation> | undefined>
  | undefined
  | null;

function isUsable(
  candidate: Partial<PostTranslation> | undefined,
): candidate is PostTranslation {
  return Boolean(candidate?.title || candidate?.content);
}

/**
 * @param translations Las traducciones del post, indexadas por locale.
 * @param requested El idioma de la ruta.
 * @param fallback El idioma por defecto del sitio.
 */
export function resolvePostTranslation(
  translations: RawTranslations,
  requested: string,
  fallback: string,
): ResolvedTranslation | null {
  if (!translations) return null;

  const wanted = translations[requested];
  if (isUsable(wanted)) {
    return { ...normalize(wanted, requested), isFallback: false };
  }

  const spare = translations[fallback];
  if (isUsable(spare)) {
    return { ...normalize(spare, fallback), isFallback: true };
  }

  for (const [locale, candidate] of Object.entries(translations)) {
    if (isUsable(candidate)) {
      return { ...normalize(candidate, locale), isFallback: true };
    }
  }

  return null;
}

function normalize(
  translation: PostTranslation,
  locale: string,
): PostTranslation {
  return {
    locale,
    title: translation.title ?? "",
    slug: translation.slug ?? "",
    content: translation.content ?? "",
  };
}

/**
 * Los idiomas en los que la publicación existe de verdad.
 *
 * Lo necesita el SEO: `alternates.languages` solo debe declarar una versión que exista, y el
 * sitemap solo debe listar la URL de un idioma que tenga texto propio. Declarar una traducción que
 * no existe manda al buscador a una página duplicada.
 */
export function availableLocales(translations: RawTranslations): string[] {
  if (!translations) return [];

  return Object.entries(translations)
    .filter(([, candidate]) => isUsable(candidate))
    .map(([locale]) => locale);
}
