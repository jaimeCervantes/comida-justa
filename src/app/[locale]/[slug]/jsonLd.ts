import { withoutHashtags } from "~/domain/entities/post/hashtags";
import { PRODUCT_KIND } from "~/domain/entities/post/hazloSanoProduct";
import { resolvePostTranslation } from "~/domain/entities/post/translations";
import { buildMetaDescription } from "~/domain/seo/description";
import { buildPostJsonLd } from "~/domain/seo/jsonLd/post";
import type { JsonLdNode } from "~/domain/seo/jsonLd/types";
import { buildSharePreview } from "~/domain/seo/shareMedia";
import { ensureAbsoluteUrl } from "~/domain/seo/url";
import {
  CANONICAL_URL,
  DEFAULT_SHARE_IMAGE,
  SITE_CURRENCY,
} from "~/infra/constants";
import type { Post } from "~/infra/types/Posts";

/**
 * Traduce una publicación al vocabulario de schema.org.
 *
 * Vive en la ruta y no en el dominio porque su trabajo es **leer el `Post` de infraestructura**,
 * que es un tipo laxo lleno de opcionales; el dominio recibe ya datos concretos y no sabe nada de
 * esta forma. La imagen y el video salen del mismo `buildSharePreview` que arma Open Graph, así
 * que lo que se comparte y lo que se declara no pueden divergir.
 */
export function buildPostStructuredData(
  post: Post,
  slug: string,
  categoryLabel: string | null | undefined,
  locale: string,
  fallbackLocale: string,
): JsonLdNode[] {
  const share = buildSharePreview(post.media, DEFAULT_SHARE_IMAGE);
  /* El dato estructurado tiene que describir **lo que la página enseña**. Si declarara siempre el
     español mientras la ficha se lee en inglés, el buscador indexaría un texto que nadie ve. */
  const translation = resolvePostTranslation(
    post.translations,
    locale,
    fallbackLocale,
  );
  const content = String(translation?.content ?? post.content ?? "");
  const publishedAt = post.createdAt ? new Date(post.createdAt) : null;

  return buildPostJsonLd({
    url: `${CANONICAL_URL}/${slug}`,
    title: String(translation?.title ?? post.title ?? ""),
    description: buildMetaDescription(content),
    isProduct: post.kind === PRODUCT_KIND,
    price: post.price ?? null,
    currency: SITE_CURRENCY,
    isAvailable: post.isAvailable !== false,
    publishedAt:
      publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    authorName: post.user?.name ?? null,
    categoryLabel: categoryLabel ?? null,
    imageUrl: ensureAbsoluteUrl(CANONICAL_URL, share.imageUrl),
    videoUrl: share.videoUrl ?? null,
    longDescription: withoutHashtags(content),
  });
}
