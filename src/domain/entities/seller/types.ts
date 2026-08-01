import type { Coordinates } from "./coordinates";

/** Lo que una persona escribe para abrir su tienda. */
export interface SellerDraft {
  name: string;
  phone: string;
  description?: string | null;
  logoUrl?: string | null;
  url?: string | null;
}

/** Lo que un vendedor escribe para dar de alta una sucursal. */
export interface BranchDraft {
  name: string;
  address: string;
  mapUrl: string;
  /** Del botón "usar mi ubicación actual"; cuando viene, gana sobre lo que diga el enlace. */
  coordinates?: Coordinates | null;
}

/** Una sucursal ya guardada. `location` es lo que el chatbot usa para el radio de cercanía. */
export interface Branch {
  id: string;
  sellerId: string;
  name: string;
  address: string;
  mapUrl: string;
  coordinates: Coordinates;
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
