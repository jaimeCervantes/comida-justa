import { getOnePostWithPaginatedComments } from "~/infra/dataAccess/getOnePostWithPaginatedComments";
import { getPostBySlug } from "~/infra/dataAccess/getOnePostWithPaginatedComments/PostgresGetOnePost";
import type { Post } from "~/infra/types/Posts";

const COMMENTS_PAGE_SIZE = 10;

/**
 * Busca la publicación por slug. Devuelve `null` cuando no existe, para que la página pueda
 * responder 404 **antes** de renderizar: si la decisión ocurriera dentro de un `<Suspense>`,
 * la respuesta ya se habría enviado con status 200 y el 404 sería solo visual.
 */
export async function getPostDetails(slug: string): Promise<Post | null> {
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
}
