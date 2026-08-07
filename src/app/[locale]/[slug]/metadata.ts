import type { Metadata } from "next";
import { PRODUCT_KIND } from "~/domain/entities/post/hazloSanoProduct";
import {
  availableLocales,
  resolvePostTranslation,
} from "~/domain/entities/post/translations";
import { buildLocalizedAlternates } from "~/domain/seo/alternates";
import { buildMetaDescription } from "~/domain/seo/description";
import { buildSharePreview } from "~/domain/seo/shareMedia";
import { getPathname } from "~/i18n/navigation";
import { routing } from "~/i18n/routing";
import {
  CANONICAL_URL,
  DEFAULT_SHARE_IMAGE,
  PUBLIC_BRAND_NAME,
} from "~/infra/constants";
import type { Post } from "~/infra/types/Posts";

/**
 * Lo que ve quien comparte una publicación por WhatsApp y lo que lee un buscador.
 *
 * Hasta ahora esta página no definía nada: heredaba el título del layout —"Hazlo Sano", igual para
 * las 24— y salía sin descripción ni imagen. Un producto compartido era un enlace pelado.
 *
 * `type: "article"` para todo lo que no se vende. Los productos se anuncian como `article`
 * también: el vocabulario de comercio de Open Graph (`product`) lo entienden pocos lectores, y los
 * datos de producto van en JSON-LD, que es lo que Google lee.
 *
 * **El canónico apunta a la versión que de verdad se está enseñando**, y cada idioma es canónico de
 * sí mismo cuando existe de verdad. Ver `postAlternates`.
 */

/**
 * El canónico de la ficha y las direcciones de sus hermanas en otros idiomas.
 *
 * **Cada idioma tiene su propio slug**, así que la ruta no se puede resolver una vez y reutilizar:
 * `/suero-natural` es `/en/natural-electrolyte-drink`. Se resuelve con `getPathname` idioma por
 * idioma y nunca concatenando, que es lo que se hacía antes y dejaba fuera el prefijo `/en`: el
 * canónico de la versión inglesa apuntaba a una dirección española que no existe.
 *
 * Se recorre `routing.locales` —y no las claves de la base— para que el tipo sea el del sitio y
 * para no declarar nunca un idioma que el sitio no sirve.
 *
 * Cuando la publicación existe en un solo idioma no se declara `languages`: anunciar una versión
 * inglesa que sirve texto español manda al buscador a un duplicado.
 */
function postAlternates(
  post: Post,
  slug: string,
  locale: string,
): Metadata["alternates"] {
  const translated = availableLocales(post.translations);
  const locales = routing.locales.filter((code) => translated.includes(code));

  if (locales.length <= 1) {
    return { canonical: `${CANONICAL_URL}/${slug}` };
  }

  const pathByLocale = Object.fromEntries(
    locales.map((code) => [
      code,
      getPathname({
        href: {
          pathname: "/[slug]",
          params: { slug: post.translations?.[code]?.slug ?? slug },
        },
        locale: code,
      }),
    ]),
  );

  return buildLocalizedAlternates({
    baseUrl: CANONICAL_URL,
    pathByLocale,
    locale,
    defaultLocale: routing.defaultLocale,
  });
}

export function buildPostMetadata(
  post: Post,
  slug: string,
  locale: string,
  fallbackLocale: string,
): Metadata {
  const translation = resolvePostTranslation(
    post.translations,
    locale,
    fallbackLocale,
  );
  const title = String(translation?.title ?? post.title ?? "");
  const content = String(translation?.content ?? post.content ?? "");
  const description = buildMetaDescription(content);
  const url = `${CANONICAL_URL}/${slug}`;
  const share = buildSharePreview(post.media, DEFAULT_SHARE_IMAGE);

  return {
    title: `${title} | ${PUBLIC_BRAND_NAME}`,
    description,
    alternates: postAlternates(post, slug, locale),
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: [{ url: share.imageUrl, alt: share.imageAlt ?? title }],
      // 8 de las 24 publicaciones son video: se anuncia como lo que es, no como imagen.
      videos: share.videoUrl ? [{ url: share.videoUrl }] : undefined,
    },
    twitter: {
      // La tarjeta grande solo cuando la imagen es de la publicación: el logo estirado se ve peor.
      card: share.hasOwnImage ? "summary_large_image" : "summary",
      title,
      description,
      images: [share.imageUrl],
    },
    other:
      post.kind === PRODUCT_KIND && post.price
        ? { "product:price:amount": String(post.price) }
        : {},
  };
}
