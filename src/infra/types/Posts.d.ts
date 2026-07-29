export type PostUser = {
  id: string;
  email?: string;
  name?: string;
  image?: string;
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
  | { [k: string]: any };

export type Comment = {
  id?: string;
  content: string;
  createdAt: string;
  user: PostUser;
  postId: string;
};
