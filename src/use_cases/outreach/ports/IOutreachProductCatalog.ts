import type { TitleLocales } from "./IOutreachTextRepository";

/** Un producto que se puede ligar a un texto de difusión, tal como lo ofrece el buscador. */
export interface OutreachProductOption {
  postId: string;
  title: string;
  price: number | null;
}

export default interface IOutreachProductCatalog {
  /**
   * Todo lo que se vende, esté disponible o no: un pan agotado hoy se liga igual y aparece en la
   * lista el día que se reponga. Lo que no está publicado no se ofrece: no se puede anunciar.
   */
  listProducts(locales: TitleLocales): Promise<OutreachProductOption[]>;
}
