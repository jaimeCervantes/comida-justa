import { type SQL, sql } from "drizzle-orm";
import { DEFAULT_MODERATION_STATUS } from "~/domain/entities/post/moderation";

/**
 * La condición que decide si una publicación se enseña, en un solo sitio.
 *
 * Nueve repositorios leen `posts` y todos tienen que filtrar igual. Repetir el literal en cada uno
 * era la forma segura de que dentro de tres meses una consulta nueva se olvidara y enseñara lo que
 * un admin bajó. Aquí se escribe una vez y `assertEveryPostQueryFilters` comprueba que nadie lea
 * `posts` sin usarla.
 *
 * Asume que la tabla está aliaseada como `p`, que es como está en las nueve. Para otro alias,
 * `publishedOnly("x")`.
 */
export const PUBLISHED_POSTS: SQL = sql`p.moderation_status = ${DEFAULT_MODERATION_STATUS}`;

export function publishedOnly(alias: string): SQL {
  return sql`${sql.raw(alias)}.moderation_status = ${DEFAULT_MODERATION_STATUS}`;
}

/**
 * Lo mismo, pero dejando pasar lo propio.
 *
 * Es lo que necesita el perfil de alguien mirando su **propio** perfil: sus publicaciones bajadas
 * le siguen apareciendo —con su aviso— porque si no, no tendría por dónde enterarse. No hay correo
 * ni notificaciones en el sitio, así que la publicación es el único mensajero.
 *
 * Con `viewerId` vacío o de otra persona, es exactamente `PUBLISHED_POSTS`.
 */
export function publishedOrOwnedBy(viewerId: string | null | undefined): SQL {
  if (!viewerId) return PUBLISHED_POSTS;

  return sql`(${PUBLISHED_POSTS} OR p.user_id = ${viewerId})`;
}
