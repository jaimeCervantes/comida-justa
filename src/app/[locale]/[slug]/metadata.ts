import type { Metadata } from "next";
import { PRODUCT_KIND } from "~/domain/entities/post/hazloSanoProduct";
import {
  availableLocales,
  resolvePostTranslation,
} from "~/domain/entities/post/translations";
import { buildMetaDescription } from "~/domain/seo/description";
import { buildSharePreview } from "~/domain/seo/shareMedia";
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
 * **El canónico apunta a la versión que de verdad se está enseñando.** Cuando la publicación no
 * existe en el idioma pedido, la página cae al de respaldo y sirve el mismo texto que la ruta
 * española: declarar esa URL como canónica es lo que evita que un buscador indexe dos direcciones
 * con contenido idéntico. Solo cuando hay traducción propia se declara la pareja de idiomas.
 */
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

  /* Solo se declara `languages` cuando la publicación existe de verdad en más de un idioma.
     Anunciar una versión inglesa que sirve texto español manda al buscador a un duplicado. */
  const locales = availableLocales(post.translations);
  const languages =
    locales.length > 1
      ? Object.fromEntries(
          locales.map((available) => [
            available,
            `${CANONICAL_URL}/${post.translations?.[available]?.slug ?? slug}`,
          ]),
        )
      : undefined;

  return {
    title: `${title} | ${PUBLIC_BRAND_NAME}`,
    description,
    alternates: { canonical: url, languages },
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
