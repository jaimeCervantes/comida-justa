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
  category: string | null;
  subCategory: string | null;
  isAvailable: boolean;
}

export interface PostContentUpdate {
  postId: string;
  locale: string;
  title: string;
  content: string;
  price: number | null;
  category: string | null;
  subCategory: string | null;
}

export default interface IPostAdminRepository {
  findBySlug(slug: string): Promise<EditablePost | null>;
  findById(postId: string): Promise<EditablePost | null>;
  setAvailability(postId: string, isAvailable: boolean): Promise<void>;
  /** El slug NO se toca al editar: cambiarlo rompería los enlaces ya compartidos. */
  updateContent(update: PostContentUpdate): Promise<void>;
}
