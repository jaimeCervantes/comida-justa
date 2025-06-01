"use client"
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
import { db } from "~/infrastructure/dataAccess/init.client";
import type { Comment } from "~/infrastructure/types/Posts";
import { mapSnapshotComments, sortByCreatedAt } from "../mapper";


export function useRealTimeComments(
  postId: string,
  initialComments: Comment[],
  firstVisibleComment: Comment
) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [firstComment, setFirstComment] = useState<Comment | null>(
    firstVisibleComment
  );
  const [commentError, setCommentError] = useState<string | null>(null);
  const firstCommentSnapshot = useFirstCommentSnapshotForCommentsQuery(postId, firstComment);

  useEffect(() => {
    const commentsQuery = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc"),
      startAfter(firstCommentSnapshot)
    );

    let initialLoad = true;

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {

        if (initialLoad) {
          initialLoad = false;
          return;
        }

        const newComments = mapSnapshotComments(snapshot);

        setComments((prevComments) => [
          ...sortByCreatedAt(newComments, 'desc'),
          ...prevComments,
        ]);
        setFirstComment(newComments[0]);
      },
      (error) => {
        console.error("Error al escuchar comentarios en tiempo real: ", error);
        setCommentError("Error al cargar comentarios en tiempo real.");
      }
    );

    return () => {
      unsubscribe();
    };
  }, [postId, firstCommentSnapshot]);

  return { comments, setComments, commentError, firstComment };
}

function useFirstCommentSnapshotForCommentsQuery(postId: string, firstComment: Comment | null) {
  const [firstCommentSnapshot, setFirstCommentSnapshot] = useState<DocumentSnapshot | null>(null);

  useEffect(() => {
    (async () => {
      if (!firstComment) {
        return;
      }

      const snapshot = await getDoc(
        doc(db, "posts", postId, "comments", firstComment.id as string)
      );

      setFirstCommentSnapshot(snapshot);
    })();
  }, [postId, firstComment]);

  return firstCommentSnapshot;
}
