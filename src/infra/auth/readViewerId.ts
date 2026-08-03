import type { User } from "~/domain/entities/post/types";
import { auth } from "~/infra/auth";

/**
 * Quién está mirando, o `null` si no hay sesión.
 *
 * Lo piden todas las pantallas que listan publicaciones, para saber cuáles son de quien mira y
 * ofrecerle editarlas o marcarlas agotadas sin salir del listado. Está aquí y no dentro de la
 * tarjeta porque la tarjeta también se pinta dentro de componentes de cliente, donde `auth()` no
 * existe: la sesión la resuelve la página y baja como prop.
 *
 * Ocultar los controles es cortesía, no seguridad: quien decide sigue siendo el servidor, que
 * compara el dueño de la publicación contra la sesión.
 */
export async function readViewerId(): Promise<string | null> {
  const session = await auth();

  return (session?.user as User | undefined)?.id ?? null;
}
