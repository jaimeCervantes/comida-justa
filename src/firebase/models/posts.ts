import type {
  WhereFilterOp,
  CollectionReference,
  DocumentSnapshot,
} from "firebase-admin/firestore";
import type { FirestorePost } from "./Posts.d";
import type { Post, PostUser } from "~/types/Posts.d";
import { Timestamp } from "firebase-admin/firestore";
import { createImageInStorage, validateFields, collections, defineSlug} from "./postUtils"

export async function getPosts({
  limit = 6,
  startAfter = null,
  by = null,
}: {
  limit?: number;
  startAfter?: DocumentSnapshot | null;
  by?: { field: string; operator: WhereFilterOp; value: string } | null;
}) {
  let query: FirebaseFirestore.Query = collections.posts();

  if (by?.field && by?.operator && by?.value) {
    query = query.where(by.field, by.operator, by.value);
  }

  query = query.orderBy("createdAt", "desc").limit(limit);

  if (startAfter) {
    query = query.startAfter(startAfter);
  }

  const snapshot = await query.get();

  const posts = snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as Post[];

  const lastItem = snapshot.docs[snapshot.docs.length - 1] ?? null;

  return {
    posts,
    lastItem,
  };
}