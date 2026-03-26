import type { CollectionReference } from "firebase-admin/firestore";
import type { FirestorePost } from "~/infra/dataAccess/Posts";
import { collections } from "~/infra/dataAccess/postUtils";

export async function getPost(
  slug: string,
  collection: CollectionReference<FirestorePost> = collections.posts(),
) {
  try {
    const queryResult = await collection
      .where("translations.es.slug", "==", slug)
      .get();

    if (queryResult.empty) {
      return {
        errorMessage: "No se encontró el post",
      };
    }
    const post = queryResult.docs[0];
    const postInfo = {
      translations: {
        es: {
          title: post?.data().translations?.es?.title,
          content: post?.data().translations?.es?.content,
          slug: post?.data().translations?.es?.slug,
        },
      },
      createdAt: post?.data().createdAt,
      user: post?.data().user,
      price: post?.data().price,
      media: post?.data().media,
      contactInfo: post?.data().contactInfo,
      id: post?.id, // at the if by error we insert an empty id field in the post, so this return the real id from firebase
    };

    return postInfo;
  } catch (error: any) {
    return {
      error,
      errorMessage: "Algo salió mal al buscar/obtener el post",
    };
  }
}
