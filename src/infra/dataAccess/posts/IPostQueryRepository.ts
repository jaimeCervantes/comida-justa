import type { PostUser } from "../users/IUserRepository";

export interface PostData {
  id: string;
  user: PostUser;
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
