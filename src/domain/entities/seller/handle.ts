import {
  generateHandle,
  type HandleRules,
  isValidHandle,
} from "~/domain/shared/publicHandle";
import { SellerHandleUnusableError } from "./errors";

/** Un identificador de menos de tres caracteres no se distingue de un error de dedo. */
export const SELLER_HANDLE_MIN_LENGTH = 3;

/** Tope para que la dirección siga siendo dictable por teléfono. */
export const SELLER_HANDLE_MAX_LENGTH = 40;

/**
 * Segmentos que la ruta `/tienda/...` necesita para sí misma, hoy o en el siguiente slice.
 *
 * La lista es corta a propósito: como las tiendas viven bajo `/tienda/` y no en la raíz, aquí no
 * hay que reservar `productos`, `publicar` ni ninguna otra sección del sitio.
 */
export const RESERVED_SELLER_HANDLES: readonly string[] = [
  "page", // /tienda/page/2 es la paginación
  "nueva", // alta de tienda
  "admin",
  "api",
];

const SELLER_HANDLE_RULES: HandleRules = {
  minLength: SELLER_HANDLE_MIN_LENGTH,
  maxLength: SELLER_HANDLE_MAX_LENGTH,
  reserved: RESERVED_SELLER_HANDLES,
};

/** La dirección web de una tienda a partir de su nombre. */
export function generateSellerHandle(name: string | null | undefined): string {
  return generateHandle(name, SELLER_HANDLE_RULES);
}

export function isReservedSellerHandle(handle: string): boolean {
  return RESERVED_SELLER_HANDLES.includes(handle);
}

export function isValidSellerHandle(handle: string): boolean {
  return isValidHandle(handle, SELLER_HANDLE_RULES);
}

/**
 * El handle definitivo de un nombre, o el error que explica por qué ese nombre no sirve
 * como dirección.
 */
export function resolveSellerHandle(name: string | null | undefined): string {
  const handle = generateSellerHandle(name);

  if (!isValidSellerHandle(handle)) {
    throw new SellerHandleUnusableError();
  }

  return handle;
}
