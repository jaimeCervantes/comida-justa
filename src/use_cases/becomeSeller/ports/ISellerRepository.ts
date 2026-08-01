import type { Seller } from "~/domain/entities/seller/types";

/** Un vendedor listo para guardarse: el borrador ya normalizado por el caso de uso. */
export interface NewSeller {
  name: string;
  handle: string;
  phone: string;
  description: string | null;
  logoUrl: string | null;
  url: string | null;
  userId: string;
}

export default interface ISellerRepository {
  /** La tienda de una cuenta, si ya la abrió. */
  findByUserId(userId: string): Promise<Seller | null>;
  /** Quién ocupa esa dirección web. Protege el índice único `ix_sellers_slug`. */
  findByHandle(handle: string): Promise<Seller | null>;
  /** Quién tiene ese teléfono. Protege el índice único de `sellers.phone`. */
  findByPhone(phone: string): Promise<Seller | null>;
  save(seller: NewSeller): Promise<Seller>;
}
