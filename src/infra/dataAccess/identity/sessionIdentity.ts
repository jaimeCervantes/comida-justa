import { cache } from "react";
import type { Seller } from "~/domain/entities/seller/types";
import type { UserProfile } from "~/domain/entities/user/types";
import { createSellerRepository } from "../sellers/factory";
import { createUserProfileRepository } from "../users/factory";

/**
 * La tienda y el perfil de quien tiene la sesión abierta, deduplicados dentro de un mismo render.
 *
 * Existen porque el encabezado pasó a necesitarlos: el menú del avatar enlaza a la tienda y al
 * perfil propios, y el encabezado se pinta en **todas** las páginas. Sin `cache()`, `/cuenta` haría
 * cuatro consultas para las mismas dos filas —dos del encabezado y dos de la propia página—.
 *
 * Es `cache()` de React y **no** `unstable_cache`: esto es dato de sesión. `unstable_cache` guarda
 * entre peticiones y compartiría la tienda de una persona con la siguiente que entre. `cache()`
 * solo deduplica dentro del render que ya está en curso, que es exactamente lo que hace falta.
 *
 * Las dos son lecturas de una fila por índice (`sellers.user_id`, `users.id`), así que en las demás
 * rutas el encabezado paga dos búsquedas puntuales, no un recorrido.
 */
export const findSellerOfUser = cache(
  (userId: string): Promise<Seller | null> =>
    createSellerRepository().findByUserId(userId),
);

export const findProfileOfUser = cache(
  (userId: string): Promise<UserProfile | null> =>
    createUserProfileRepository().findByUserId(userId),
);

export interface PublicAddresses {
  /** La dirección de su tienda, o `null` si no la ha abierto. */
  storeHandle: string | null;
  /** Su dirección personal, o `null` si no la ha reservado. */
  username: string | null;
}

/** Lo que el menú del avatar necesita saber: qué páginas propias existen ya. */
export async function findPublicAddresses(
  userId: string,
): Promise<PublicAddresses> {
  const [seller, profile] = await Promise.all([
    findSellerOfUser(userId),
    findProfileOfUser(userId),
  ]);

  return {
    storeHandle: seller?.handle ?? null,
    username: profile?.username ?? null,
  };
}
