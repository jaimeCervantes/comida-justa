import type {
  CollectionReference,
} from "firebase-admin/firestore";
import type { FirestorePost } from "~/firebase/Posts.d";
import { collections } from "~/firebase/postUtils";

export async function getPost(
  slug: string,
  collection: CollectionReference<FirestorePost> = collections.posts()
) {
  try {
    const queryResult = await collection.where("slug", "==", slug).get();

    if (queryResult.empty) {
      return {
        errorMessage: "No se encontró el post",
      };
    }

    const postInfo = {
      ...queryResult.docs[0]?.data(),
      id: queryResult.docs[0]?.id, // at the if by error we insert an empty id field in the post, so this return the real id from firebase
    };

    return postInfo;
  } catch (error: any) {
    return {
      error,
      errorMessage: "Algo salió mal al buscar/obtener el post",
    };
  }
}