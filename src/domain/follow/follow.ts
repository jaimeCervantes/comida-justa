/**
 * A quién apunta un seguimiento.
 *
 * Son dos destinos y no uno porque hacen falta los dos: una tienda creada por el chatbot puede no
 * tener dueño, y una persona puede publicar sin tener tienda —5 de las 23 publicaciones de la base
 * están así—, de modo que ninguno de los dos se puede expresar con el otro.
 */
export type FollowTarget =
  | { kind: "seller"; sellerId: string }
  | { kind: "user"; userId: string };

/** Lo que impide guardar un seguimiento, en el idioma del dominio y no del SQL. */
export type FollowRejection = "no-target" | "two-targets" | "self";

export interface FollowRequest {
  followerId: string;
  sellerId?: string | null;
  followedId?: string | null;
}

/**
 * Por qué no se puede guardar este seguimiento, o `null` si se puede.
 *
 * La base lo garantiza con `num_nonnulls(seller_id, followed_id) = 1` y con su `CHECK` de no
 * seguirse a uno mismo. Esto lo dice **antes**, para que el fallo llegue como una razón y no como
 * una violación de restricción que hay que traducir leyendo el nombre del índice.
 */
export function rejectionFor({
  followerId,
  sellerId,
  followedId,
}: FollowRequest): FollowRejection | null {
  if (sellerId && followedId) return "two-targets";
  if (!sellerId && !followedId) return "no-target";
  if (followedId && followedId === followerId) return "self";

  return null;
}

/** El destino ya validado, para que quien lo guarda no vuelva a preguntarse cuál de los dos es. */
export function targetOf(request: FollowRequest): FollowTarget | null {
  if (rejectionFor(request) !== null) return null;

  return request.sellerId
    ? { kind: "seller", sellerId: request.sellerId }
    : { kind: "user", userId: String(request.followedId) };
}

/**
 * ¿Se enseña el número de seguidores?
 *
 * **Con cero no se pinta nada**, y no es un detalle de estilo. Hoy hay una tienda y un perfil
 * reclamado en toda la base, así que un «0 seguidores» aparecería en el 100% de las páginas y
 * convertiría una página nueva en una página abandonada. Callarlo deja la misma página diciendo
 * solo lo que sí es cierto.
 *
 * Es regla de dominio y no CSS porque el día que alguien quiera enseñarlo a partir de diez, o solo
 * al dueño, el sitio donde se discute eso es este.
 */
export function showsFollowerCount(followers: number): boolean {
  return followers > 0;
}
