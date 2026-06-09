export interface PostData {
  id: string;
  userId: string;
  price: number | null;
  contactInfo: {
    phone: string;
    email?: string;
    whatsapp?: string;
  };
  translations: Record<string, { title: string; slug: string; content: string }>;
  media: Array<{ url: string; type: string; alt?: string }>;
  createdAt: Date;
}

export interface PaginatedPostsResult {
  posts: PostData[];
  nextPage: number | null;
  prevPage: number;
  total: number;
  totalPages: number;
}

export interface IPostQueryRepository {
  getMultiplePosts(
    page: number,
    pageSize: number,
  ): Promise<PaginatedPostsResult>;
  getTotalPosts(): Promise<number>;
}
