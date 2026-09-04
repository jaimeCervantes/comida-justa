/** De quién es una publicación: quien la escribió y, si la hay, la tienda que la vende. */
export type PostOwnership = {
  ownerId: string;
  /** `posts.seller_id`. Nulo cuando quien publicó no tiene tienda. */
  sellerId?: string | null;
};

/** Quién pregunta. Los dos salen de la sesión, **nunca** de un formulario. */
export type Requester = {
  userId: string;
  /** El de su tienda, resuelto con `findSellerOfUser`. Nulo si no ha abierto ninguna. */
  sellerId?: string | null;
};

/**
 * ¿Puede esta persona administrar esta publicación?
 *
 * Dos vías, no una. La de siempre —quien la escribió— y la que abre esta entrega: **el dueño de la
 * tienda que la vende**, publicara quien la publicara. Una tienda con varias manos necesita que
 * quien la lleva pueda tocar su catálogo sin ser la cuenta que redactó cada ficha.
 *
 * Hoy las dos apuntan a la misma persona —las 432 publicaciones son de `44pZIIJ5w1vSYkDQ6gfb`, que
 * además es el dueño de `Hazlo Sano`—, así que esto no cambia nada hasta el día que no sea así.
 *
 * **Los nulos no se comparan.** Sin `sellerId` a un lado o al otro, la vía de la tienda no existe:
 * un `null === null` habría dejado que cualquiera que publicó sin tienda administrara lo de
 * cualquier otro que también publicó sin tienda.
 */
export function canManagePost(
  post: PostOwnership,
  requester: Requester,
): boolean {
  if (post.ownerId === requester.userId) return true;

  return Boolean(
    post.sellerId && requester.sellerId && post.sellerId === requester.sellerId,
  );
}
