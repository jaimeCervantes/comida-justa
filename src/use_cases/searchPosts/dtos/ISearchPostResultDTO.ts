import type { Post } from "~/domain/entities/post/types";

/**
 * Lo mínimo para pintar la tienda de un resultado y llegar a ella.
 *
 * Se declara aquí en vez de importarse de `presentation/` o de `infra/` porque un caso de uso no
 * puede depender de ninguna de las dos. Es la misma forma que ya declaran `PostData.seller` y el
 * repositorio de búsqueda, por el mismo motivo.
 */
export type SearchStoreIdentity = {
  handle: string;
  name: string;
  logoUrl?: string | null;
};

export type ISearchPostResultDTO = Post & {
  id: string;
  /**
   * De quién es, o `null` cuando no hay a dónde enlazar.
   *
   * El repositorio lo devolvía desde que los resultados empezaron a enseñar la tienda, pero el DTO
   * no lo declaraba: el `as unknown as` que había al final del mapeo hacía que TypeScript no
   * comparara nada. Quitarlo —al pasar `media` a plural— lo dejó a la vista.
   */
  seller?: SearchStoreIdentity | null;
  /**
   * A cuántos metros está la tienda de quien busca, o `null`.
   *
   * `null` significa "no se puede saber": ni la publicación tiene tienda, ni la tienda dio
   * sucursal, o no sabemos dónde está quien busca. **Nunca significa que el resultado esté lejos**
   * — en una búsqueda nada se esconde por distancia.
   */
  distanceMeters?: number | null;
};
