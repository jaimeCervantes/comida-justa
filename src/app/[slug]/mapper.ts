import type { FirestoreComment } from "~/firebase/models/Posts.d";
import { QuerySnapshot } from "firebase/firestore";

export function mapSnapshotComments(snapshot: QuerySnapshot) {
  if (!snapshot.empty) {
    const newComments = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      };
    }) as FirestoreComment[];

    return newComments;
  }

  return [];
}

export function sortByCreatedAt(items: FirestoreComment[]): FirestoreComment[] {
  return items.toSorted(
    (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
  );
}
