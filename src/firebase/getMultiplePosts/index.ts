import type {
  WhereFilterOp
} from "firebase-admin/firestore";
import type { FirestorePost } from "~/firebase/Posts.d";
import { collections } from "~/firebase/postUtils"

const firstPage = 1;
export async function getMultiplePosts(
  page: number = 1,
  pageSize: number = 10,
  by: null | { field: string; operator: string; value: string } = null
) {
  page = Math.max(Number(page), firstPage);
  let query: any = collections.posts();

  if (by?.field && by?.operator && by?.value) {
    query = query.where(by.field, by.operator as WhereFilterOp, by.value);
  }

  const total = (await query.count().get()).data().count;

  const posts = await query
    .orderBy("createdAt", "desc")
    .limit(pageSize)
    .offset(page === firstPage ? 0 : Number(page - 1) * pageSize)
    .get();

  const postData = posts.docs.map((doc: FirestorePost) => {
    return { ...doc.data(), id: doc.id };
  });

  const hasNextPage = total > page * pageSize;

  return {
    posts: postData,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: page === firstPage ? firstPage : page - 1,
    total: total,
    lastVisible: posts.docs.length > 0 ? posts.docs[posts.docs.length - 1] : null
  };
}

export async function getTotalPosts(
  by: null | { field: string; operator: string; value: string } = null
) {
  let query: any = collections.posts();

  if (by?.field && by?.operator && by?.value) {
    query = query.where(by.field, by.operator as WhereFilterOp, by.value);
  }

  const total = (await query.count().get()).data().count;
  return total;
}