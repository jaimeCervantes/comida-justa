import { slugify } from "~/domain/shared/slugify";
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
  "page", // /tienda/page/2 será la paginación
  "nueva", // alta de tienda
  "admin",
  "api",
];

/**
 * La dirección web de una tienda a partir de su nombre.
 *
 * Se recorta **antes** de quitar el guion final, para que "Panadería La Luz de Tezonapa…"
 * no termine en `-` al pasarse de largo.
 */
export function generateSellerHandle(name: string | null | undefined): string {
  return slugify(name).slice(0, SELLER_HANDLE_MAX_LENGTH).replace(/-+$/, "");
}

export function isReservedSellerHandle(handle: string): boolean {
  return RESERVED_SELLER_HANDLES.includes(handle);
}

export function isValidSellerHandle(handle: string): boolean {
  return (
    handle.length >= SELLER_HANDLE_MIN_LENGTH &&
    handle.length <= SELLER_HANDLE_MAX_LENGTH &&
    !isReservedSellerHandle(handle)
  );
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
