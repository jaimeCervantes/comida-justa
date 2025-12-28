import { ISearchPostRepository } from "~/business/searchPosts/ports/ISearchPostRepository";
import { collections } from "~/infrastructure/dataAccess/postUtils";
import { FirestorePost } from "~/infrastructure/dataAccess/Posts";
import { ISearchPostResultDTO } from "~/business/searchPosts/dtos/ISearchPostResultDTO";
import VertexEmbeddingService from "~/infrastructure/services/VertexEmbeddingService";

export class FirebaseSearchPostRepository implements ISearchPostRepository {
  async search(
    query: string,
    page: number,
    pageSize: number,
    locale: string = "es"
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }> {
    const postsRef = collections.posts();
    const embeddingService = new VertexEmbeddingService();

    const mapToDTO = (doc: any) => {
      const data = doc.data() as FirestorePost;
      return {
        id: doc.id,
        title: data.translations?.[locale]?.title || "",
        slug: data.translations?.[locale]?.slug || "",
        content: data.translations?.[locale]?.content || "",
        media: data.media,
        createdAt: data.createdAt,
        price: data.price || 0,
        user: data.user,
      } as unknown as ISearchPostResultDTO;
    };

    // Optimization: If no search query is provided, use Firestore's native pagination capabilities.
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

    // Vector Search Implementation
    try {
      // throw new Error("Force fallback to text search"); // TEMPORARY: Disable vector search until fully tested
      // Try to reuse a cached embedding for this exact search term to avoid
      // calling the embedding service on every request.
      const normalizedQuery = query.trim().toLowerCase();
      const cacheDocId = encodeURIComponent(normalizedQuery);
      let vector: number[] | undefined;

      try {
        const cacheRef = (postsRef as any).firestore.collection("search_embedding").doc(cacheDocId);
        const cacheSnap = await cacheRef.get();
        if (cacheSnap.exists) {
          const cached = cacheSnap.data();
          if (cached?.vector && Array.isArray(cached.vector)) {
            console.log("Using cached embedding for query:", normalizedQuery);
            vector = cached.vector as number[];
          }
        }

        if (!vector) {
          vector = await embeddingService.generateEmbedding(query);
          // Fire-and-forget cache write (don't block search on cache write)
          cacheRef.set({ query: normalizedQuery, vector, createdAt: new Date() }).catch((err: any) =>
            console.warn("Failed to write embedding cache", err)
          );
        }
      } catch (cacheErr) {
        console.warn("Embedding cache read/write failed, continuing without cache:", cacheErr);
        vector = await embeddingService.generateEmbedding(query);
      }
      /**
       * WORKAROUND FOR PAGINATION:
       * Firestore's vector search `findNearest` currently does not support `offset()` or cursor-based pagination
       * in the same efficient way as standard queries.
       *
       * Strategy: "Overshooting"
       * We fetch (page * pageSize) items (finding the top N nearest neighbors) and slice the array in memory
       * to return only the requested page.
       *
       * Limit: We cap this at MAX_VECTOR_RESULTS to prevent performance issues on deep pages.
       */
      const MAX_VECTOR_RESULTS = 60; // Cap search depth
      const limit = Math.min(page * pageSize, MAX_VECTOR_RESULTS);
      const vectorFieldPath = `translations.${locale}.embedding`;
      console.log("vectorFieldPath:", vectorFieldPath, "locale:", locale);

      const vectorQuery = (postsRef as any).findNearest({
        queryVector: vector,
        limit: limit,
        distanceMeasure: "COSINE",
        vectorField: vectorFieldPath,
      });

      const snapshot = await vectorQuery.get();
      const allResults = snapshot.docs.map(mapToDTO);

      // Slice the results for the current page
      const startIndex = (page - 1) * pageSize;
      const results = allResults.slice(startIndex, startIndex + pageSize);

      // Estimate Total:
      // If we found fewer items than requested (limit), we've reached the end.
      // If we found 'limit' items, there are likely more, so we report MAX_VECTOR_RESULTS
      // to allow the UI to show "Next" until we hit the cap.
      const total = snapshot.size < limit ? snapshot.size : MAX_VECTOR_RESULTS;

      return { results, total };
    } catch (error) {
      console.error(
        "Vector search failed, falling back to basic text filter:",
        error
      );

      // Fallback to legacy in-memory filter if vector search fails (temporarily)
      const snapshot = await postsRef.get();
      const allPosts = snapshot.docs.map((doc: any) => {
        const data = doc.data() as FirestorePost;
        return {
          id: doc.id,
          title: data.translations?.[locale]?.title || "",
          slug: data.translations?.[locale]?.slug || "",
          content: data.translations?.[locale]?.content || "",
          media: data.media,
          createdAt: data.createdAt,
          price: data.price || 0,
          user: data.user,
        } as unknown as ISearchPostResultDTO;
      });

      const filtered = allPosts.filter((post) => {
        const title = post.title?.toLowerCase() || "";
        const content = post.content?.toLowerCase() || "";
        const q = query.toLowerCase();
        return title.includes(q) || content.includes(q);
      });

      const total = filtered.length;
      const results = filtered.slice((page - 1) * pageSize, page * pageSize);
      return { results, total };
    }
  }
}
