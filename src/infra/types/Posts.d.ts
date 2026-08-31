export type PostUser = {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  /** La dirección que reclamó: con ella la publicación enlaza a `/u/<username>`. */
  username?: string;
};

export type Post =
  | (Post &
      Partial<{
        id: string;
        summary: string;
        kind: "anuncio" | "producto";
        origin: string | null;
        contactInfo: {
          phone: string;
          email?: string;
          whatsapp?: string;
        };
        modifiedBy: PostUser;
        modifiedAt: string;
        createdAt: string;
        comments: Comment[];
        lastVisibleComment: Any;
        firstVisibleComment: Any;
        createdAtLocale: string;
        to: string;
      }>)
  | { [k: string]: unknown };

export type Comment = {
  id?: string;
  content: string;
  createdAt: string;
  user: PostUser;
  postId: string;
  /**
   * Ausente cuando la consulta que lo trajo no lo pidió. Un comentario que llega sin esta columna
   * se trata como publicado, igual que `resolveModerationStatus` en el resto del sitio.
   */
  moderationStatus?: string;
  moderationReason?: string | null;
};
