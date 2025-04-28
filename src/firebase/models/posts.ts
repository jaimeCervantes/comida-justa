import type {
  WhereFilterOp,
  CollectionReference,
} from "firebase-admin/firestore";
import type { FirestorePost } from "./Posts.d";
import type { Post, PostUser } from "~/types/Posts.d";
import { Timestamp } from "firebase-admin/firestore";
import { createFileInStorage, validateFields, collections, defineSlug} from "./postUtils"

const firstPage = 1;
export async function getPosts(
  page: number = 1,
  pageSize: number = 10,
  by: null | { field: string; operator: string; value: string } = null
) {
  page = Math.max(Number(page), firstPage);
  let query: any = collections.posts();

  if (by?.field && by?.operator && by?.value) {
    query = query.where(by.field, by.operator as WhereFilterOp, by.value);
  }

  const total = (await query.count().get()).data().count;

  const posts = await query
    .orderBy("createdAt", "desc")
    .limit(pageSize)
    .offset(page === firstPage ? 0 : Number(page - 1) * pageSize)
    .get();

  const postData = posts.docs.map((doc: FirestorePost) => {
    return { ...doc.data(), id: doc.id };
  });

  return {
    posts: postData,
    nextPage: page + 1,
    prevPage: page === firstPage ? firstPage : page - 1,
    total: total,
  };
}

export async function createPost(postInfo: Post, file: File, user: PostUser) {
  validateFields(postInfo, file, user);

  const slug = await defineSlug(
    postInfo.title as string,
    postInfo.slug as string
  );

  let fileUrl = '';
  try {
    fileUrl = await createFileInStorage(file)
  } catch (error: any) {
    return {
      error,
      errorMessage: "Algo salió mal al crear y/o obtener el archivo del post en el storage",
    };
  }

  try {
    const post = await collections.posts().add({
      ...postInfo,
      slug,
      file: fileUrl,
      user,
      createdAt: Timestamp.now(),
    });

    return { id: post.id, slug };
  } catch (error: any) {
    return {
      error,
      errorMessage: "Algo salió mal al crear el post",
    };
  }
}

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
