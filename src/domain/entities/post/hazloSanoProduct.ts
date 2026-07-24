import { isValidKind, type PostKind } from "./kind";
import { isHazloSanoOrigin } from "./origin";

/** El `kind` que representa algo en venta (lo que lista la página de productos). */
export const PRODUCT_KIND: PostKind = "producto";

type ProvenanceFields = {
  kind?: string | null;
  origin?: string | null;
};

/**
 * Un "producto de Hazlo Sano" es la intersección de los dos ejes: `kind = "producto"`
 * (qué es) y un `origin` `hazlo_sano_*` (quién lo vende). Es la definición que usa el
 * listado de productos; vive en el dominio para que infra y UI no la reinventen.
 */
export function isHazloSanoProduct(post: ProvenanceFields): boolean {
  return (
    isValidKind(post.kind) &&
    post.kind === PRODUCT_KIND &&
    isHazloSanoOrigin(post.origin)
  );
}
