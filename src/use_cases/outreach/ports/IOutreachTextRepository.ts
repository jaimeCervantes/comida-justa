import type { OutreachTextDraft } from "~/domain/outreach/outreachTextDraft";
import type { OutreachListedProduct } from "~/domain/outreach/priceList";

/** En qué idioma van los títulos de los productos, y a cuál caer si falta. */
export interface TitleLocales {
  locale: string;
  fallbackLocale: string;
}

/** Una fila de la lista de `/admin/difusion`. */
export interface OutreachTextSummary {
  id: string;
  name: string;
  productCount: number;
  updatedAt: Date;
}

/** Un producto del texto con su título, que el formulario necesita y la lista de precios no. */
export interface StoredOutreachProduct extends OutreachListedProduct {
  title: string;
}

/**
 * Un texto de difusión con sus productos **como están hoy**: precio, inventario y moderación se
 * leen de `posts` en la misma consulta, nunca de una copia guardada con el texto.
 */
export interface StoredOutreachText {
  id: string;
  name: string;
  opening: string;
  closing: string;
  /** En el orden del texto. */
  products: StoredOutreachProduct[];
}

export default interface IOutreachTextRepository {
  /** Del más reciente al más viejo: el que se acaba de tocar es el que se busca. */
  list(): Promise<OutreachTextSummary[]>;
  /** Nulo también si `id` no tiene forma de identidad: una dirección inventada es un 404. */
  findById(
    id: string,
    locales: TitleLocales,
  ): Promise<StoredOutreachText | null>;
  /** Guarda el texto y sus productos de una vez; devuelve su identidad. */
  create(draft: OutreachTextDraft): Promise<string>;
  /**
   * Reemplaza el texto y sus productos de una vez. `false` si ya no existe: lo borró otra persona
   * entre que se abrió el formulario y se guardó.
   */
  update(id: string, draft: OutreachTextDraft): Promise<boolean>;
}
