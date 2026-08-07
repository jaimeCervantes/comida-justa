import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type { Branch } from "~/domain/entities/seller/types";

export interface NewBranch {
  sellerId: string;
  name: string;
  address: string;
  mapUrl: string;
  coordinates: Coordinates;
}

export default interface IBranchRepository {
  listBySeller(sellerId: string): Promise<Branch[]>;
  save(branch: NewBranch): Promise<Branch>;
  /**
   * A qué distancia queda la sucursal **más cercana** de quien mira, en metros.
   *
   * `null` cuando no se puede saber: o el visitante no dio su ubicación, o la tienda no tiene
   * ninguna sucursal situada. Son dos motivos distintos con la misma respuesta a propósito —la
   * pantalla hace lo mismo en ambos casos: no pintar nada—.
   *
   * Lo calcula la base y no JavaScript. Ver la nota en `locationFreshness.ts`: la distancia que se
   * le enseña a alguien sale de `ST_Distance` sobre `geography`, que usa el elipsoide, y mezclar las
   * dos aritméticas haría que `/directorio` y `/tienda/[handle]` discreparan sobre la misma tienda.
   */
  distanceToNearestBranch(
    sellerId: string,
    near: Coordinates | null,
  ): Promise<number | null>;
}
