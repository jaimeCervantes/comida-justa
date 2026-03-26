import { getStorage, getDownloadURL } from "firebase-admin/storage";
import IMediaStorageService from "~/use_cases/createOnePost/ports/IMediaStorageService";
import { fileTypeFromStream, type FileTypeResult } from "file-type";

export default class FirebaseMediaStorageService implements IMediaStorageService {
  async uploadFile(file: File): Promise<string> {
    const bucket = getStorage().bucket();
    const buffer = Buffer.from(await file.arrayBuffer());
    const type = file.type;
    const filePath = this.createFilePath(type, file.name);

    await bucket.file(filePath).save(buffer, { contentType: type });

    const fileUrl = await getDownloadURL(bucket.file(filePath));

    return fileUrl;
  }

  createFilePath(type: string, fileName: string, sourceDir = "posts"): string {
    return `${sourceDir}/${type}/${fileName}`;
  }

  async validateFileAndGetType(file: File): Promise<string | null> {
    const MAX_FILE_SIZE = 50 * 1024 * 1024;

    if (!file || file.size <= 0) {
      throw new Error(
        "No se proporcionó ningún archivo o el archivo está vacío.",
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `El archivo es demasiado grande. El tamaño máximo permitido es ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
      );
    }

    let fileTypeResult: FileTypeResult | undefined;
    try {
      // file.stream() proporciona un ReadableStream
      // file-type puede leer directamente de un stream de Node.js
      fileTypeResult = await fileTypeFromStream(file.stream());
    } catch (error) {
      console.error(
        "Error leyendo el stream del archivo para determinar el tipo:",
        error,
      );
      throw new Error("No se pudo procesar el contenido del archivo.");
    }

    if (!fileTypeResult) {
      console.warn(
        `file-type no pudo determinar el tipo de archivo a partir del contenido. MIME reportado por navegador: ${file.type}`,
      );
      throw new Error(
        "No se pudo determinar el tipo de archivo a partir del contenido.",
      );
    }

    const detectedMimeType = fileTypeResult.mime;
    const TYPES = ["image", "video", "audio"];
    const expectedMediaType = TYPES.find((type) =>
      detectedMimeType.startsWith(type),
    );

    if (expectedMediaType === undefined) {
      console.warn(
        `Validación de contenido fallida. Tipo esperado: ${expectedMediaType}, MIME detectado: ${detectedMimeType}, MIME navegador: ${file.type}`,
      );
      throw new Error(
        `El tipo de archivo real (${detectedMimeType}) no es compatible con el tipo de publicación esperado (${expectedMediaType}).`,
      );
    }

    if (file.type && file.type !== detectedMimeType) {
      console.warn(
        `Discrepancia de MIME type: Navegador reportó ${file.type}, Contenido detectó ${detectedMimeType} para el archivo ${file.name}`,
      );
      throw new Error("Discrepancia en el tipo de archivo reportado.");
    }

    return fileTypeResult.mime.split("/")[0];
  }
}
