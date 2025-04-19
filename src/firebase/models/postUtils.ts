import type {
    CollectionReference,
} from "firebase-admin/firestore";
import type { FirestorePost } from "./Posts.d";
import type { Post, PostUser } from "~/types/Posts.d";
import { getStorage, getDownloadURL } from "firebase-admin/storage";
import { getCollectionWithConverter } from "./converter";
import invariant from "tiny-invariant";

export const collections = {
    posts: () => getCollectionWithConverter<FirestorePost>("posts"),
};

export function validateFields(postInfo: Post, image: File, user: PostUser) {
    invariant(
      postInfo?.constructor === {}.constructor,
      `"postInfo" debe ser un objeto, no un ${postInfo && postInfo?.constructor}`
    );
  
    if (image) {
      invariant(
        image?.constructor.name === "File",
        `"image" debe ser un File, no un ${image && image?.constructor}`
      );
    }
  
    invariant(
      user?.constructor === {}.constructor,
      `"user" debe ser un objeto, no un ${user && user?.constructor}`
    );
  
    invariant(postInfo.title, "El título es requerido");
    invariant(postInfo.content, "El contenido es requerido");
  }
  
  export async function defineSlug(title: string, slug?: string): Promise<string> {
    if (!slug || slug?.trim() === "") {
      slug = await createSlug(title, collections.posts());
    }
  
    return slug;
  }
  
  export async function createSlug(
    title: string,
    collection: CollectionReference<FirestorePost> = collections.posts()
  ) {
    const slug = title
      .toLowerCase()
      .normalize("NFD") // Normal Form Decomposition, convierte un character en dos o más, por ejemplo, su forma base y su acento
      .replace(/[\u0300-\u036f]/g, "") // Remueve los acentos de las letras (diacríticos)
      .replace(/[^a-z0-9]+/g, "-") // Remueve los carácteres que no sean letras o números, (incluyendo acentos)
      .replace(/(^-|-$)+/g, ""); // Remueve los guiones al inicio y al final
  
    const doc = await collection.where("slug", "==", slug).get();
  
    if (doc.size) {
      return `${slug}-${doc.size}`;
    }
  
    return slug;
  }
  
  export async function createFileInStorage(file: File): Promise<string> {
    const bucket = getStorage().bucket();
    const buffer = Buffer.from(await file.arrayBuffer());
    const type = file.type;
  
    await bucket
      .file(`posts/${type}/${file.name}`)
      .save(buffer, { contentType: type });
  
    const fileUrl = await getDownloadURL(bucket.file(`posts/${file.name}`));
  
    return fileUrl;
  }