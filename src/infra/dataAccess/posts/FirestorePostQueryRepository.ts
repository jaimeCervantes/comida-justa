import type { WhereFilterOp } from "firebase-admin/firestore";
import type { FirestorePost } from "~/infra/dataAccess/Posts";
import { collections } from "~/infra/dataAccess/postUtils";
import type { IPostQueryRepository, PostData, PaginatedPostsResult } from "./IPostQueryRepository";

const firstPage = 1;

export class FirestorePostQueryRepository implements IPostQueryRepository {
  async getMultiplePosts(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedPostsResult> {
    page = Math.max(Number(page), firstPage);
    const query = collections.posts();

    const total = (await query.count().get()).data().count;

    const postsSnap = await query
      .orderBy("createdAt", "desc")
      .limit(pageSize)
      .offset(page === firstPage ? 0 : Number(page - 1) * pageSize)
      .get();

    const postData: PostData[] = postsSnap.docs.map((doc: FirestorePost) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.user?.id ?? "",
        price: data.price ?? null,
        contactInfo: {
          phone: data.contactInfo?.phone ?? "",
          email: data.contactInfo?.email,
          whatsapp: data.contactInfo?.whatsapp,
        },
        translations: data.translations ?? {},
        media: data.media ?? [],
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      };
    });

    const hasNextPage = total > page * pageSize;

    return {
      posts: postData,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: page === firstPage ? firstPage : page - 1,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getTotalPosts(): Promise<number> {
    const query = collections.posts();
    const total = (await query.count().get()).data().count;
    return total;
  }
}
