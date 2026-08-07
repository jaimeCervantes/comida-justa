import { cache } from "react";
import { pickRelated } from "~/domain/entities/post/related";
import { routing } from "~/i18n/routing";
import { RELATED_POSTS_LIMIT } from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { getOnePostWithPaginatedComments } from "~/infra/dataAccess/getOnePostWithPaginatedComments";
import { getPostBySlug } from "~/infra/dataAccess/getOnePostWithPaginatedComments/PostgresGetOnePost";
import type { Post } from "~/infra/types/Posts";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";

const COMMENTS_PAGE_SIZE = 10;

/**
 * Busca la publicación por slug. Devuelve `null` cuando no existe, para que la página pueda
 * responder 404 **antes** de renderizar: si la decisión ocurriera dentro de un `<Suspense>`,
 * la respuesta ya se habría enviado con status 200 y el 404 sería solo visual.
 *
 * Va memorizada por petición (`cache`) porque ahora la piden dos: `generateMetadata` y la página.
 * Sin esto, cada visita al detalle costaría el doble de consultas para leer lo mismo.
 */
export const getPostDetails = cache(async function getPostDetails(
  slug: string,
): Promise<Post | null> {
  // Primero PostgreSQL (la creación de posts ya es solo PG).
  const pgResult = await getPostBySlug(slug);
  if (!("errorMessage" in pgResult)) {
    return pgResult;
  }

  // Fallback a Firestore para posts aún no migrados.
  const legacyResult = await getOnePostWithPaginatedComments(
    slug,
    COMMENTS_PAGE_SIZE,
  );

  return legacyResult.error === true ? null : legacyResult;
});

/**
 * Las publicaciones que acompañan a la que se está leyendo.
 *
 * Se piden **más de las que se pintan** porque el dominio todavía descarta lo agotado: pedir
 * justo cuatro dejaría el bloque a tres en cuanto un vendedor apague un producto. Una publicación
 * sin vector —o una base sin vecinos— devuelve una lista vacía, y el bloque no se pinta.
 */
export const getRelatedPosts = cache(async function getRelatedPosts(
  postId: string,
  locale: string,
): Promise<Post[]> {
  const candidates = await createPostQueryRepository().getRelatedPosts(
    postId,
    locale,
    routing.defaultLocale,
    RELATED_POSTS_LIMIT * 2,
  );

  return mapPostsToCardsForLocale(
    pickRelated(candidates, postId, RELATED_POSTS_LIMIT) as Post[],
    locale,
  );
});
