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
      media: {
        url: string;
        type: string;
        name: string;
      },
      modifiedBy: PostUser;
      modifiedAt: string;
      createdAt: string;
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
