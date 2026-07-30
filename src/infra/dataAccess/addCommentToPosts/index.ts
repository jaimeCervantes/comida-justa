import {
  FieldValue,
  getFirestore,
  type Timestamp,
} from "firebase-admin/firestore";
import type { FirestoreComment } from "~/infra/dataAccess/Posts";
import { collections } from "~/infra/dataAccess/postUtils";
import type { PostUser } from "~/infra/types/Posts";

export async function addCommentToPost(
  postId: string,
  commentContent: string,
  user: PostUser,
) {
  try {
    const postRef = collections.posts().doc(postId);

    const postSnapshot = await postRef.get();
    if (!postSnapshot.exists) {
      return {
        errorMessage: "El post no existe",
      };
    }

    const newComment: FirestoreComment = {
      content: commentContent,
      createdAt: FieldValue.serverTimestamp() as Timestamp,
      user: user,
      postId: postId,
    };

    const commentsRef = postRef.collection("comments");
    await commentsRef.add(newComment);

    return {
      successMessage: "Comentario agregado exitosamente",
      comment: newComment,
    };
  } catch (error) {
    return {
      error,
      errorMessage: "Ocurrió un error al agregar el comentario",
    };
  }
}

export async function getMoreComments(
  postId: string,
  lastVisibleComment: unknown,
  pageSize: number = 10,
) {
  try {
    const db = getFirestore();
    const commentsRef = db
      .collection(`posts/${postId}/comments`)
      .orderBy("createdAt", "desc")
      .limit(pageSize);

    const query = lastVisibleComment
      ? commentsRef.startAfter(lastVisibleComment)
      : commentsRef;

    const querySnapshot = await query.get();

    const comments: FirestoreComment[] = [];
    let lastVisible: FirestoreComment | null = null;

    querySnapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() } as FirestoreComment);
    });

    if (!querySnapshot.empty) {
      lastVisible = comments[comments.length - 1];
    }

    return {
      comments,
      lastVisibleComment: lastVisible,
    };
  } catch (error) {
    console.error("Error obteniendo más comentarios:", error);
    return {
      errorMessage: "Hubo un error al cargar más comentarios.",
    };
  }
}
