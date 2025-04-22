export type PostUser = {
  id: string;
  email?: string;
  name?: string;
  image?: string;
};

export type Post =
  | Partial<{
      id: string;
      title: string;
      summary: string;
      contactInfo: {
        phone: string;
        email?: string
        whatsapp?: string,
      },
      content: string;
      price: number;
      slug: string;
      image: string;
      fileType?: string;
      modifiedBy: PostUser;
      modifiedAt: string;
      createdAt?: string;
      createdAtLocale?: string;
      user: PostUser;
      comments: Comment[];
      lastVisibleComment: Any;
      firstVisibleComment: Any;
    }>
  | { [k: string]: any };


export type Comment = {
    id?: string;
    content: string;
    createdAt: string;
    user: PostUser;
    postId: string;
};
