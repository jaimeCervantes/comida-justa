import type { Post } from "~/domain/entities/post/types";

export type ISearchPostResultDTO = Post & {
  id: string;
  /**
   * A cuántos metros está la tienda de quien busca, o `null`.
   *
   * `null` significa "no se puede saber": ni la publicación tiene tienda, ni la tienda dio
   * sucursal, o no sabemos dónde está quien busca. **Nunca significa que el resultado esté lejos**
   * — en una búsqueda nada se esconde por distancia.
   */
  distanceMeters?: number | null;
};
