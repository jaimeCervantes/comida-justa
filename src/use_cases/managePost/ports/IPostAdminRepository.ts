import type { PostMediaFile } from "~/domain/entities/post/types";

/** Lo que hace falta para editar una publicación y decidir si quien pide es su dueño. */
export interface EditablePost {
  id: string;
  ownerId: string;
  /**
   * La tienda que lo vende (`posts.seller_id`), o `null` si quien publicó no tiene.
   *
   * Se lee para autorizar, no para pintar: es la segunda vía de `canManagePost`, la que deja que
   * el dueño de una tienda administre lo que publicó otra mano.
   */
  sellerId: string | null;
  slug: string;
  locale: string;
  title: string;
  content: string;
  contactPhone: string | null;
  price: number | null;
  kind: string;
  origin: string | null;
  category: string | null;
  subCategory: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  durationMinutes: number | null;
  isAvailable: boolean;
  /** Cuántas quedan, o `null` si no lleva inventario. **Nulo no es cero.** */
  stockQuantity: number | null;
  /**
   * Los archivos que ya tiene, en su `sort_order`.
   *
   * Se leen aquí y no en una consulta aparte porque el formulario no puede pintar lo que hay sin
   * ellos, y editar sin ver lo que hay es adivinar: quien quita "el segundo" tiene que estar
   * mirándolo. El 0 es la portada que leen la tarjeta, el carrito y el bot.
   */
  media: PostMediaFile[];
}

export interface PostContentUpdate {
  postId: string;
  locale: string;
  title: string;
  content: string;
  contactPhone: string;
  price: number | null;
  /** Ya resuelta contra el rol de quien edita: el gate de admin vive en la capa de aplicación. */
  origin: string | null;
  category: string | null;
  subCategory: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  durationMinutes: number | null;
  /**
   * La lista **completa** que la publicación va a tener, no un delta.
   *
   * Es lo que el formulario enseña: quien edita ve los archivos, quita, añade y mueve, y lo que
   * envía es el resultado. Un delta obligaría a las dos partes a ponerse de acuerdo sobre qué es
   * "el mismo archivo" cuando lo único que las une es una URL de Cloud Storage.
   */
  media: PostMediaFile[];
}

/**
 * Las dos columnas se mueven juntas o no se mueven.
 *
 * `isAvailable` no es un dato que mande quien edita: lo deriva el caso de uso del número
 * (`availabilityForStock`). Viaja en la misma escritura para que no exista un instante en el que un
 * producto en cero siga anunciándose a quien filtra por `is_available` — o sea, al chatbot.
 */
export interface PostStockUpdate {
  postId: string;
  quantity: number;
  isAvailable: boolean;
}

export default interface IPostAdminRepository {
  findBySlug(slug: string): Promise<EditablePost | null>;
  findById(postId: string): Promise<EditablePost | null>;
  setAvailability(postId: string, isAvailable: boolean): Promise<void>;
  setStock(update: PostStockUpdate): Promise<void>;
  /** El slug NO se toca al editar: cambiarlo rompería los enlaces ya compartidos. */
  updateContent(update: PostContentUpdate): Promise<void>;
}
