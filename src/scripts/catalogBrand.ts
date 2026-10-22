import { normalizeBrand } from "~/domain/entities/post/brand";

/**
 * La marca de un producto del catálogo del proveedor: su `supplierName` («Birdman», «Amarosana»).
 *
 * Vive aparte del importador para poder probarla: importar `importSupplierCatalog.ts` lo ejecuta.
 * Se normaliza igual que la que escribe un vendedor, así que «Birdman » del catálogo y «Birdman» de
 * un formulario son la misma marca al agrupar.
 */
export function catalogBrand(product: {
  supplierName?: string | null;
}): string | null {
  return normalizeBrand(product.supplierName);
}
