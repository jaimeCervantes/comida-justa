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
      content: string;
      price: number;
      slug: string;
      image: string;
      modifiedBy: PostUser;
      modifiedAt: string;
      createdAt: string;
      user: PostUser;
    }>
  | { [k: string]: any };
