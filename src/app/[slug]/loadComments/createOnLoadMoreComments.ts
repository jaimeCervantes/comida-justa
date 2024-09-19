import {
  query,
  collection,
  orderBy,
  startAfter,
  limit,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "~/firebase/init.client";
import type { FirestoreComment } from "~/firebase/models/Posts.d";
import { mapSnapshotComments } from "../mapper";

export function createOnLoadMoreComments({
  postId,
  lastComment,
  setLoading,
  setLoadMoreMessage,
  setComments,
  setLastComment,
}: {
  postId: string;
  lastComment: FirestoreComment | null;
  setLoading: (isLoading: boolean) => void;
  setLoadMoreMessage: (message: string) => void;
  setComments: (comments: FirestoreComment[]) => void;
  setLastComment: (lastComment: FirestoreComment) => void;
}) {
  return async function () {
    setLoading(true);
    const lastCommentSnapshot = await getDoc(
      doc(db, "posts", postId, "comments", lastComment?.id)
    );

    const moreQuery = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "desc"),
      startAfter(lastCommentSnapshot),
      limit(10)
    );

    const querySnapshot = await getDocs(moreQuery);

    setLoading(false);

    if (querySnapshot.empty) {
      setLoadMoreMessage("Ya no hay más comentarios.");
    } else {
      const moreComments = mapSnapshotComments(querySnapshot);
      setComments((prevComments: FirestoreComment[]) => [
        ...prevComments,
        ...moreComments,
      ]);

      setLastComment(moreComments[moreComments.length - 1]);
    }
  };
}
