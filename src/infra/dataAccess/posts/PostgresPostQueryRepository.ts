import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { posts, postTranslations, postMedia } from "~/infra/dataAccess/db/schema/posts";
import type { IPostQueryRepository, PostData, PaginatedPostsResult } from "./IPostQueryRepository";

export class PostgresPostQueryRepository implements IPostQueryRepository {
  async getMultiplePosts(
    page: number,
    pageSize: number,
  ): Promise<PaginatedPostsResult> {
    const offset = (page - 1) * pageSize;

    const postRows = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(pageSize)
      .offset(offset);

    if (postRows.length === 0) {
      return {
        posts: [],
        nextPage: null,
        prevPage: page > 1 ? page - 1 : 1,
        total: 0,
        totalPages: 0,
      };
    }

    const postIds = postRows.map((p) => p.id);

    const translationRows = await db
      .select()
      .from(postTranslations)
      .where(inArray(postTranslations.postId, postIds));

    const mediaRows = await db
      .select()
      .from(postMedia)
      .where(inArray(postMedia.postId, postIds))
      .orderBy(postMedia.sortOrder);

    const translationsByPost = new Map<
      string,
      Record<string, { title: string; slug: string; content: string }>
    >();
    for (const t of translationRows) {
      if (!translationsByPost.has(t.postId)) {
        translationsByPost.set(t.postId, {});
      }
      translationsByPost.get(t.postId)![t.locale] = {
        title: t.title,
        slug: t.slug,
        content: t.content,
      };
    }

    const mediaByPost = new Map<
      string,
      Array<{ url: string; type: string; alt?: string }>
    >();
    for (const m of mediaRows) {
      if (!mediaByPost.has(m.postId)) {
        mediaByPost.set(m.postId, []);
      }
      mediaByPost.get(m.postId)!.push({
        url: m.url,
        type: m.type,
        alt: m.alt ?? undefined,
      });
    }

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts);
    const total = Number(totalResult[0].count);

    const postData: PostData[] = postRows.map((row) => ({
      id: row.id,
      userId: row.userId,
      price: row.price ? Number(row.price) : null,
      contactInfo: {
        phone: row.contactPhone ?? "",
        email: row.contactEmail ?? undefined,
        whatsapp: row.contactWhatsapp ?? undefined,
      },
      translations: translationsByPost.get(row.id) ?? {},
      media: mediaByPost.get(row.id) ?? [],
      createdAt: row.createdAt,
    }));

    const hasNextPage = total > page * pageSize;

    return {
      posts: postData,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: page === 1 ? 1 : page - 1,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getTotalPosts(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts);
    return Number(result[0].count);
  }
}
