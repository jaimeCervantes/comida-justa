import type { QuerySnapshot } from "firebase/firestore";
import type { Comment } from "~/infra/types/Posts";

export function mapSnapshotComments(snapshot: QuerySnapshot) {
  if (!snapshot.empty) {
    const newComments = snapshot
      .docChanges()
      .filter((change) => change.type === "added")
      .map((change) => {
        const data = change.doc.data();

        return {
          id: change.doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        };
      }) as Comment[];

    return newComments;
  }

  return [];
}

export function sortByCreatedAt(items: Comment[], order: string): Comment[] {
  return items.toSorted((a: Comment, b: Comment) => {
    if (order !== "desc") {
      [a, b] = [b, a];
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
