'use server'

import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type { FirestoreComment } from "~/firebase/Posts";
import { collections } from "~/firebase/postUtils"
import { PostUser } from "~/types/Posts";
import { getFirestore } from "firebase-admin/firestore";

export async function addCommentToPost(
  postId: string,
  commentContent: string,
  user: PostUser
) {
  try {
    const postRef = collections.posts().doc(postId);

    // Verificar si el post existe
    const postSnapshot = await postRef.get();
    if (!postSnapshot.exists) {
      return {
        errorMessage: "El post no existe",
      };
    }

    // Crear el comentario
    const newComment: FirestoreComment = {
      content: commentContent,
      createdAt: FieldValue.serverTimestamp() as Timestamp,
      user: user,
      postId: postId
    };

    // Guardar el comentario en la subcolección 'comments' del post
    const commentsRef = postRef.collection("comments");
    const newCommentRef = await commentsRef.add(newComment);

    const newCommentSnapshot = await newCommentRef.get()
    const addedComment = newCommentSnapshot.data();

    const timestamp = addedComment?.timestamp as Timestamp | null;
    const timestampDate = timestamp ? timestamp.toDate() : null;

    return {
      successMessage: "Comentario agregado exitosamente",
      comment: {
        ...addedComment,
        id: newCommentRef.id,
        createdAt: timestampDate,
      }
    };
  } catch (error: any) {
    console.log(error);
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

    // Si hay un último comentario visible, lo usamos como cursor para la paginación
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

    // Si hay comentarios, obtenemos el último visible para usarlo en la siguiente paginación
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
