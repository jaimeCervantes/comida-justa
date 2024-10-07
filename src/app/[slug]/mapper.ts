import { QuerySnapshot } from "firebase/firestore";
import type { FirestoreComment } from "~/firebase/models/Posts.d";
import type { Comment } from "~/types/Posts";

export function mapSnapshotComments(snapshot: QuerySnapshot) {
  if (!snapshot.empty) {
    const newComments = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      };
    }) as Comment[];

    return newComments;
  }

  return [];
}

export function sortByCreatedAt(items: Comment[]): Comment[] {
  return items.toSorted(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
