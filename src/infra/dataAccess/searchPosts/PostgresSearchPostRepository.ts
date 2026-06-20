import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { posts, postTranslations, postMedia } from "~/infra/dataAccess/db/schema/posts";
import { users } from "~/infra/dataAccess/db/schema/auth";
import type { ISearchPostRepository } from "~/use_cases/searchPosts/ports/ISearchPostRepository";
import type { ISearchPostResultDTO } from "~/use_cases/searchPosts/dtos/ISearchPostResultDTO";

export class PostgresSearchPostRepository implements ISearchPostRepository {
  async search(
    query: string,
    page: number,
    pageSize: number,
    locale: string = "es",
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }> {
    const hasQuery = query && query.trim() !== "";

    // ── Match posts ──────────────────────────────────────────────
    let matchedPostIds: string[];
    let total: number;

    if (hasQuery) {
      const pattern = `%${query.trim()}%`;

      const matchRows = await db
        .select({ postId: postTranslations.postId })
        .from(postTranslations)
        .where(
          and(
            eq(postTranslations.locale, locale),
            or(
              ilike(postTranslations.title, pattern),
              ilike(postTranslations.content, pattern),
            ),
          ),
        );

      // Deduplicate — a post may match on both title and content
      matchedPostIds = [...new Set(matchRows.map((r) => r.postId))];
      total = matchedPostIds.length;
    } else {
      // No query: return all posts ordered by newest
      const all = await db
        .select({ id: posts.id })
        .from(posts)
        .orderBy(desc(posts.createdAt));

      matchedPostIds = all.map((r) => r.id);
      total = matchedPostIds.length;
    }

    if (matchedPostIds.length === 0) {
      return { results: [], total: 0 };
    }

    // ── Paginate ─────────────────────────────────────────────────
    const offset = (page - 1) * pageSize;
    const pageIds = matchedPostIds.slice(offset, offset + pageSize);

    if (pageIds.length === 0) {
      return { results: [], total };
    }

    // ── Fetch full data for current page ─────────────────────────
    const [postRows, translationRows, mediaRows] = await Promise.all([
      db.select().from(posts).where(inArray(posts.id, pageIds)),
      db
        .select()
        .from(postTranslations)
        .where(
          and(
            inArray(postTranslations.postId, pageIds),
            eq(postTranslations.locale, locale),
          ),
        ),
      db
        .select()
        .from(postMedia)
        .where(inArray(postMedia.postId, pageIds))
        .orderBy(postMedia.sortOrder),
    ]);

    const userIds = [...new Set(postRows.map((p) => p.userId))];
    const userRows = userIds.length > 0
      ? await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
          })
          .from(users)
          .where(inArray(users.id, userIds))
      : [];

    // ── Index helpers ────────────────────────────────────────────
    const translationByPost = new Map<string, { title: string; slug: string; content: string }>();
    for (const t of translationRows) {
      translationByPost.set(t.postId, {
        title: t.title,
        slug: t.slug,
        content: t.content,
      });
    }

    const mediaByPost = new Map<string, Array<{ url: string; type: string; alt?: string }>>();
    for (const m of mediaRows) {
      if (!mediaByPost.has(m.postId)) mediaByPost.set(m.postId, []);
      mediaByPost.get(m.postId)!.push({
        url: m.url,
        type: m.type,
        alt: m.alt ?? undefined,
      });
    }

    const userById = new Map(userRows.map((u) => [u.id, u]));

    // ── Assemble results ─────────────────────────────────────────
    // Note: ISearchPostResultDTO extends Post, whose `media` type is a single object
    // but the app actually uses arrays everywhere. Cast to match runtime behavior.
    const results = postRows.map((row) => {
      const translation = translationByPost.get(row.id);
      const user = userById.get(row.userId);

      return {
        id: row.id,
        price: row.price ? Number(row.price) : null,
        contactInfo: {
          phone: row.contactPhone ?? "",
          email: row.contactEmail ?? undefined,
          whatsapp: row.contactWhatsapp ?? undefined,
        },
        translations: {
          [locale]: {
            title: translation?.title ?? "",
            slug: translation?.slug ?? "",
            content: translation?.content ?? "",
          },
        },
        media: mediaByPost.get(row.id) ?? [],
        user: {
          id: user?.id ?? row.userId,
          email: user?.email ?? undefined,
          name: user?.name ?? undefined,
          image: user?.image ?? undefined,
        },
        createdAt: row.createdAt,
      };
    });

    // Preserve original order (matchedPostIds ordering, which is createdAt DESC for no-query, or match order for query)
    results.sort(
      (a, b) => pageIds.indexOf(a.id) - pageIds.indexOf(b.id),
    );

    return { results: results as unknown as ISearchPostResultDTO[], total };
  }
}
