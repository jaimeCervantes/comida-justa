import type { Metadata } from "next";
import { PRODUCT_KIND } from "~/domain/entities/post/hazloSanoProduct";
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
 * **El canónico se queda en español aunque se sirva `/en/<slug>`.** Aquí no hay pareja de idiomas
 * que declarar: el contenido sale de `post_translations`, que hoy tiene 24 filas en español y
 * ninguna en inglés, así que la versión inglesa es el mismo texto con otro marco.
 */
export function buildPostMetadata(post: Post, slug: string): Metadata {
  const title = String(post.translations?.es?.title ?? post.title ?? "");
  const content = String(post.translations?.es?.content ?? post.content ?? "");
  const description = buildMetaDescription(content);
  const url = `${CANONICAL_URL}/${slug}`;
  const share = buildSharePreview(post.media, DEFAULT_SHARE_IMAGE);

  return {
    title: `${title} | ${PUBLIC_BRAND_NAME}`,
    description,
    alternates: { canonical: url },
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
