import type { IndexingCounts } from "~/domain/entities/post/indexingReport";
import type { OriginCount } from "~/domain/entities/post/originReport";
import type { PostUser } from "../users/IUserRepository";

export interface PostData {
  id: string;
  user: PostUser;
  price: number | null;
  /** Qué es: "anuncio" (default) o "producto". */
  kind?: string;
  /** De dónde/quién viene. `null` = comunidad sin especificar. */
  origin: string | null;
  contactInfo: {
    phone: string;
    email?: string;
    whatsapp?: string;
  };
  translations: Record<
    string,
    { title: string; slug: string; content: string }
  >;
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
  /** Solo lo que vende Hazlo Sano: `kind = producto` con `origin` `hazlo_sano_*`. */
  getHazloSanoProducts(
    page: number,
    pageSize: number,
  ): Promise<PaginatedPostsResult>;
  getTotalPosts(): Promise<number>;
  /** Cuántos productos hay por `origin` (`null` incluido). Base del reporte de procedencia. */
  getProductCountsByOrigin(): Promise<OriginCount[]>;
  /** Traducciones de producto con y sin vector: lo que el chatbot puede y no puede ver. */
  getProductIndexingCounts(): Promise<IndexingCounts>;
}
