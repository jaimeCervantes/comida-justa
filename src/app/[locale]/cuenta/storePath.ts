/**
 * La dirección pública de una tienda.
 *
 * Vive con prefijo `/tienda/` y no en la raíz porque la raíz ya es de las publicaciones
 * (`src/app/[locale]/[slug]`): con `localePrefix: "as-needed"`, `hazlosano.com/jugo-verde` es el
 * detalle de un producto. Separando los namespaces, una tienda y una publicación pueden llamarse
 * igual sin taparse.
 */
export const STORE_BASE_PATH = "/tienda";

export function storePath(handle: string): string {
  return `${STORE_BASE_PATH}/${handle}`;
}
