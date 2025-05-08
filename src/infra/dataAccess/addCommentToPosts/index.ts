import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type { FirestoreComment } from "~/infra/dataAccess/Posts";
import { collections } from "~/infra/dataAccess//postUtils"
import { PostUser } from "~/infra/types/Posts";
import { getFirestore } from "firebase-admin/firestore";

export async function addCommentToPost(
  postId: string,
  commentContent: string,
  user: PostUser
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
      postId: postId
    };

    const commentsRef = postRef.collection("comments");
    await commentsRef.add(newComment);

    return {
      successMessage: "Comentario agregado exitosamente",
      comment: newComment,
    };
  } catch (error: any) {
    return {
      error,
      errorMessage: "Ocurrió un error al agregar el comentario",
    };
  }
}

export async function getMoreComments(postId: string, lastVisibleComment: any, pageSize: number = 10) {
  try {
    const db = getFirestore();
    const commentsRef = db.collection(`posts/${postId}/comments`)
      .orderBy("createdAt", "desc")
      .limit(pageSize);

    let query;
    if (lastVisibleComment) {
      query = commentsRef.startAfter(lastVisibleComment);
    } else {
      query = commentsRef;
    }

    const querySnapshot = await query.get();

    const comments: FirestoreComment[] = [];
    let lastVisible = null;

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
