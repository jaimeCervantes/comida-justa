import type { ListingSource } from "~/domain/outreach/listingArticles";
import type { OutreachTextDraft } from "~/domain/outreach/outreachTextDraft";

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

/**
 * Un producto del texto con su título y sus fotos: los necesitan el formulario y los artículos de
 * compraventa, no la lista de precios. Las fotos son solo imágenes, en su orden.
 */
export type StoredOutreachProduct = ListingSource;

/**
 * Un texto de difusión con sus productos **como están hoy**: precio, inventario y moderación se
 * leen de `posts` en la misma consulta, nunca de una copia guardada con el texto.
 */
export interface StoredOutreachText {
  id: string;
  name: string;
  opening: string;
  /** Las otras versiones de lo que va antes de la lista, en orden; vacío si solo hay una. */
  versions: string[];
  closing: string;
  /** El pie compartido que lleva, como está hoy; nulo si no lleva ninguno. */
  footer: StoredOutreachFooter | null;
  /** En el orden del texto. */
  products: StoredOutreachProduct[];
}

/** Un pie compartido, ya guardado. */
export interface StoredOutreachFooter {
  id: string;
  name: string;
  body: string;
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
