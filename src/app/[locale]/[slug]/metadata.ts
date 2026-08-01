import type { Metadata } from "next";
import { PRODUCT_KIND } from "~/domain/entities/post/hazloSanoProduct";
import { buildMetaDescription } from "~/domain/seo/description";
import { CANONICAL_URL, PUBLIC_BRAND_NAME } from "~/infra/constants";
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
 */
export function buildPostMetadata(post: Post, slug: string): Metadata {
  const title = String(post.translations?.es?.title ?? post.title ?? "");
  const content = String(post.translations?.es?.content ?? post.content ?? "");
  const description = buildMetaDescription(content);
  const url = `${CANONICAL_URL}/${slug}`;
  const image = post.media?.[0]?.url;

  return {
    title: `${title} | ${PUBLIC_BRAND_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      // Sin imagen, una tarjeta grande deja un hueco: se degrada a la de resumen.
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
    other:
      post.kind === PRODUCT_KIND && post.price
        ? { "product:price:amount": String(post.price) }
        : {},
  };
}
