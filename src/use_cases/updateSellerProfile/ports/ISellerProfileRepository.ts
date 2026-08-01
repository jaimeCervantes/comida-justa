import type { Seller } from "~/domain/entities/seller/types";

/** Lo que se puede corregir de una ficha. La dirección (`slug`) no está: es inmutable. */
export interface SellerProfileUpdate {
  name: string;
  phone: string;
  description: string | null;
  url: string | null;
  logoUrl: string | null;
}

export default interface ISellerProfileRepository {
  /** El vendedor sale de la sesión, nunca del formulario. */
  findByUserId(userId: string): Promise<Seller | null>;
  findByPhone(phone: string): Promise<Seller | null>;
  updateProfile(sellerId: string, update: SellerProfileUpdate): Promise<Seller>;
}
