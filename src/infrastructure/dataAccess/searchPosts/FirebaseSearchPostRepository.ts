import { ISearchPostRepository } from "~/business/searchPosts/ports/ISearchPostRepository";
import { collections } from "~/infrastructure/dataAccess/postUtils";
import { FirestorePost } from "~/infrastructure/dataAccess/Posts";
import { ISearchPostResultDTO } from "~/business/searchPosts/dtos/ISearchPostResultDTO";

export class FirebaseSearchPostRepository implements ISearchPostRepository {
  async search(
    query: string,
    page: number,
    pageSize: number,
    locale?: string
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }> {
    const postsRef = collections.posts();

    const mapToDTO = (doc: any) => {
      const data = doc.data() as FirestorePost;
      const p = data as any;
      let title = data.title;
      let content = data.content;
      let slug = data.slug;

      if (locale && p.translations && p.translations[locale]) {
        title = p.translations[locale].title || title;
        content = p.translations[locale].content || content;
        slug = p.translations[locale].slug || slug;
      }
      return {
        id: doc.id,
        ...data,
        title,
        content,
        slug,
      } as unknown as ISearchPostResultDTO;
    };

    // Optimization: If no search query is provided, use Firestore's native pagination capabilities.
    // This avoids fetching the entire collection when just browsing the list.
    if (!query || query.trim() === "") {
      const countSnapshot = await postsRef.count().get();
      const total = countSnapshot.data().count;

      const snapshot = await postsRef
        .orderBy("createdAt", "desc")
        .offset((page - 1) * pageSize)
        .limit(pageSize)
        .get();

      const results = snapshot.docs.map(mapToDTO);

      return { results, total };
    }

    // Fallback: Firestore does not support full text search natively.
    // For search queries, we currently fetch all posts and filter in memory.
    // TODO: For production with large datasets, integrate Algolia, Typesense, or ElasticSearch.

    const snapshot = await postsRef.get();
    const allPosts = snapshot.docs.map(mapToDTO);

    const filtered = allPosts.filter((post) => {
      const title =
        post.translations?.[locale || "es"]?.title?.toLowerCase() || "";
      const content =
        post.translations?.[locale || "es"]?.content?.toLowerCase() || "";
      const q = query.toLowerCase();
      return title.includes(q) || content.includes(q);
    });

    const total = filtered.length;
    const results = filtered.slice((page - 1) * pageSize, page * pageSize);

    return { results, total };
  }
}
