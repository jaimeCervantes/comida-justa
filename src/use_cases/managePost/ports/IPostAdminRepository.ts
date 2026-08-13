import type { PostMediaFile } from "~/domain/entities/post/types";

/** Lo que hace falta para editar una publicación y decidir si quien pide es su dueño. */
export interface EditablePost {
  id: string;
  ownerId: string;
  slug: string;
  locale: string;
  title: string;
  content: string;
  price: number | null;
  kind: string;
  origin: string | null;
  category: string | null;
  subCategory: string | null;
  isAvailable: boolean;
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
  price: number | null;
  /** Ya resuelta contra el rol de quien edita: el gate de admin vive en la capa de aplicación. */
  origin: string | null;
  category: string | null;
  subCategory: string | null;
  /**
   * La lista **completa** que la publicación va a tener, no un delta.
   *
   * Es lo que el formulario enseña: quien edita ve los archivos, quita, añade y mueve, y lo que
   * envía es el resultado. Un delta obligaría a las dos partes a ponerse de acuerdo sobre qué es
   * "el mismo archivo" cuando lo único que las une es una URL de Cloud Storage.
   */
  media: PostMediaFile[];
}

export default interface IPostAdminRepository {
  findBySlug(slug: string): Promise<EditablePost | null>;
  findById(postId: string): Promise<EditablePost | null>;
  setAvailability(postId: string, isAvailable: boolean): Promise<void>;
  /** El slug NO se toca al editar: cambiarlo rompería los enlaces ya compartidos. */
  updateContent(update: PostContentUpdate): Promise<void>;
}
