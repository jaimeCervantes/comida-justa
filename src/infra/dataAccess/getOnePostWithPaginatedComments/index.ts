import type {
  CollectionReference,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import type { FirestoreComment, FirestorePost } from "~/infra/dataAccess/Posts";
import { collections } from "~/infra/dataAccess/postUtils";
import type { Post } from "~/infra/types/Posts";

export async function getOnePostWithPaginatedComments(
  slug: string,
  limit = 10, // Número de comentarios por página
  lastCommentSnapshot?: QueryDocumentSnapshot<FirestoreComment>, // Para la paginación
  collection: CollectionReference<FirestorePost> = collections.posts(),
): Promise<Post | { error: boolean; errorMessage: string }> {
  try {
    const queryResult = await collection
      .where("translations.es.slug", "==", slug)
      .get();

    if (queryResult.empty) {
      return {
        error: true,
        errorMessage: "No se encontró el post",
      };
    }

    const postDoc = queryResult.docs[0];
    const postInfo = {
      translations: {
        es: {
          title: postDoc?.data().translations?.es?.title,
          content: postDoc?.data().translations?.es?.content,
          slug: postDoc?.data().translations?.es?.slug,
        },
      },
      createdAt: postDoc?.data().createdAt,
      user: postDoc?.data().user,
      price: postDoc?.data().price,
      media: postDoc?.data().media,
      contactInfo: postDoc?.data().contactInfo,
      id: postDoc.id,
    };

    let commentsQuery = postDoc.ref
      .collection("comments")
      .orderBy("createdAt", "desc")
      .limit(limit);

    // Si tenemos un último comentario de la página anterior, lo usamos como cursor para la siguiente página
    if (lastCommentSnapshot) {
      commentsQuery = commentsQuery.startAfter(lastCommentSnapshot);
    }

    // Hasta aquí es cuando de verdad se ejecuta la consulta
    const commentsSnapshot = await commentsQuery.get();

    const comments = commentsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        postId: postInfo.id,
        id: doc.id,
        createdAt: data.createdAt.toDate(),
      };
    });

    let firstVisibleComment;
    let lastVisibleComment;
    if (comments.length > 0) {
      firstVisibleComment = comments[0];
      lastVisibleComment = comments[comments.length - 1];
    }

    return {
      ...postInfo,
      comments,
      firstVisibleComment,
      lastVisibleComment, // Pasamos el último comentario para futuras paginaciones
    };
  } catch (error: any) {
    return {
      error,
      errorMessage: "Algo salió mal al obtener el post y los comentarios",
    };
  }
}
