import type {
    CollectionReference,
} from "firebase-admin/firestore";
import type { FirestorePost } from "./Posts.d";
import type { Post, PostUser } from "~/types/Posts.d";
import { getStorage, getDownloadURL } from "firebase-admin/storage";
import { getCollectionWithConverter } from "./converter";
import invariant from "tiny-invariant";
import {fileTypeFromStream, FileTypeResult } from "file-type";

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
  
    const querySnapshot = await collection.where("slug", "==", slug).get();
  
    if (querySnapshot.size) {
      return `${slug}-${querySnapshot.size}`;
    }
  
    return slug;
  }
  
export function createFilePath(type: string, fileName: string): string {
  return `posts/${type}/${fileName}`;
}

export async function createFileInStorage(file: File): Promise<string> {
  const bucket = getStorage().bucket();
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = file.type;
  const filePath = createFilePath(type, file.name);

  await bucket
    .file(filePath)
    .save(buffer, { contentType: type });

  const fileUrl = await getDownloadURL(bucket.file(filePath));

  return fileUrl;
}

export async function validateFileAnGetType(file: File): Promise<string | null> {
  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  if (!file || file.size <= 0) {
       throw new Error("No se proporcionó ningún archivo o el archivo está vacío.");
  }

  if (file.size > MAX_FILE_SIZE) {
      throw new Error(`El archivo es demasiado grande. El tamaño máximo permitido es ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
  }


  let fileTypeResult: FileTypeResult | undefined;
  try {
      // file.stream() proporciona un ReadableStream
      // file-type puede leer directamente de un stream de Node.js
      fileTypeResult = await fileTypeFromStream(file.stream());
  } catch (error) {
      console.error("Error leyendo el stream del archivo para determinar el tipo:", error);
       throw new Error("No se pudo procesar el contenido del archivo.");
  }

  if (!fileTypeResult) {
       console.warn(`file-type no pudo determinar el tipo de archivo a partir del contenido. MIME reportado por navegador: ${file.type}`);
       throw new Error("No se pudo determinar el tipo de archivo a partir del contenido.");
  }

  const detectedMimeType = fileTypeResult.mime;
  const TYPES = ["image", "video", "audio"];
  const expectedMediaType = TYPES.find((type) => detectedMimeType.startsWith(type));

  if (expectedMediaType === undefined) {
       console.warn(`Validación de contenido fallida. Tipo esperado: ${expectedMediaType}, MIME detectado: ${detectedMimeType}, MIME navegador: ${file.type}`);
       throw new Error(`El tipo de archivo real (${detectedMimeType}) no es compatible con el tipo de publicación esperado (${expectedMediaType}).`);
  }

  if (file.type && file.type !== detectedMimeType) {
       console.warn(`Discrepancia de MIME type: Navegador reportó ${file.type}, Contenido detectó ${detectedMimeType} para el archivo ${file.name}`);
       throw new Error("Discrepancia en el tipo de archivo reportado.");
  }

  return fileTypeResult.mime.split("/")[0];
}