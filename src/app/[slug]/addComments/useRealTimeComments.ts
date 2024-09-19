import { useState, useEffect } from "react";
import {
  query,
  collection,
  orderBy,
  startAfter,
  onSnapshot,
  getDoc,
  doc,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "~/firebase/init.client";
import type { FirestoreComment } from "~/firebase/models/Posts.d";
import { mapSnapshotComments, sortByCreatedAt } from "../mapper";

export function useRealTimeComments(
  postId: string,
  initialComments: FirestoreComment[],
  firstVisibleComment: FirestoreComment
) {
  const [comments, setComments] = useState<FirestoreComment[]>(initialComments);
  const [firstComment, setFirstComment] = useState<FirestoreComment | null>(
    firstVisibleComment
  );
  const [addCommentError, setAddCommentError] = useState<string | null>(null);
  const [hasAddedComment, setHasAddedComment] = useState(false);
  const [firstCommentSnapshot, setFirstCommentSnapshot] =
    useState<DocumentSnapshot | null>(null);

  const [firstTime, setFirstTime] = useState(false);

  useEffect(() => {
    (async () => {
      if (!firstComment) {
        return;
      }

      const snapshot = await getDoc(
        doc(db, "posts", postId, "comments", firstComment.id)
      );

      setFirstCommentSnapshot(snapshot);
    })();
  }, [postId, firstComment]);

  useEffect(() => {
    if (!hasAddedComment) {
      return;
    }

    const commentsQuery = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc"),
      startAfter(firstCommentSnapshot)
    );

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const newComments = mapSnapshotComments(snapshot);

        setComments((prevComments) => [
          ...sortByCreatedAt(newComments),
          ...prevComments,
        ]);
        setFirstComment(newComments[0]);
        setHasAddedComment(false);
      },
      (error) => {
        console.error("Error al escuchar comentarios en tiempo real: ", error);
        setAddCommentError("Error al cargar comentarios en tiempo real.");
      }
    );

    return () => {
      unsubscribe();
    };
  }, [postId, firstCommentSnapshot, hasAddedComment]);

  return { comments, setComments, setHasAddedComment, addCommentError };
}
