/** Lo que una persona escribe para abrir su tienda. */
export interface SellerDraft {
  name: string;
  phone: string;
  description?: string | null;
  logoUrl?: string | null;
  url?: string | null;
}

/** Un vendedor ya guardado. `handle` es `sellers.slug`: su dirección en `/tienda/<handle>`. */
export interface Seller {
  id: string;
  name: string;
  handle: string | null;
  phone: string;
  description: string | null;
  logoUrl: string | null;
  url: string | null;
  userId: string | null;
}
