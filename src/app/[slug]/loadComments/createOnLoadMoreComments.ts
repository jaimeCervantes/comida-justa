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
import { db } from "~/infrastructure/dataAccess/init.client";
import type { Comment } from "~/infrastructure/types/Posts";
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
  lastComment: Comment | null;
  setLoading: (isLoading: boolean) => void;
  setLoadMoreMessage: (message: string) => void;
  setComments: (comments: (comment: Comment[]) => Comment[]) => void;
  setLastComment: (lastComment: Comment) => void;
}) {
  return async function () {
    setLoading(true);
    const lastCommentSnapshot = await getDoc(
      doc(db, "posts", postId, "comments", lastComment?.id as string)
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
      setComments((prevComments: Comment[]) => ([
        ...prevComments,
        ...moreComments
      ]))

      setLastComment(moreComments[moreComments.length - 1]);
    }
  };
}
