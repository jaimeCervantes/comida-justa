import { Timestamp } from "firebase-admin/firestore";
import type {
  CollectionReference,
} from "firebase-admin/firestore";
import type { FirestorePost } from "~/infra/dataAccess/Posts";
import { getStorage, getDownloadURL } from "firebase-admin/storage";
import { fileTypeFromStream, FileTypeResult } from "file-type";
import PostValidator from "~/domain/PostValidator";
import PostEntity from "~/entities/post/Post";
import { Post, User } from "~/entities/post/types"
import { collections } from "../postUtils";

const validator = new PostValidator();
const postEntity = new PostEntity();

export async function createOnePost(postInfo: Partial<Post>, file: File, user: User) {
  validator.validate({ ...postInfo, file, user } as Post);

  const slug = await defineSlug(
    postInfo.title as string,
    postInfo.slug as string
  );

  let type: string | null = null;
  try {
    type = await validateFileAnGetType(file);
  } catch (error: any) {
    return {
      error,
      errorMessage: "El archivo no es un tipo de archivo válido",
    };
  }

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
      media: {
        url: fileUrl,
        type: type,
        alt: postInfo.title,
      },
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

async function defineSlug(title: string, slug?: string): Promise<string> {
  if (!slug || slug?.trim() === "") {
    slug = await createSlug(title, collections.posts());
  }

  return slug;
}

async function createSlug(
  title: string,
  collection: CollectionReference<FirestorePost> = collections.posts()
) {
  const slug = postEntity.generateSlug(title);

  const querySnapshot = await collection.where("slug", "==", slug).get();

  if (querySnapshot.size) {
    return `${slug}-${querySnapshot.size}`;
  }

  return slug;
}


export async function createFileInStorage(file: File): Promise<string> {
  const bucket = getStorage().bucket();
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = file.type;
  const filePath = postEntity.createFilePath(type, file.name);

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