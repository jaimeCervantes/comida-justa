import { getFirestore } from "firebase-admin/firestore";
import getErrorMessage from "~/domain/shared/getErrorMessage";

// Tipos para el SEO
type SeoMeta = {
  content: string;
  name: string;
};

type SeoData = {
  title: string;
  metas: SeoMeta[];
};

// Tipo para la respuesta de la función
type SaveSeoResult = {
  success: boolean;
  documentId: string;
  updateTime?: string;
  error?: string;
  errorCode?: string;
  errorDetails?: unknown;
};

/**
 * Guarda o actualiza la información SEO de un documento en Firestore
 * @param collectionName - Nombre de la colección
 * @param documentId - ID del documento a actualizar
 * @param seoData - Datos SEO a guardar
 * @returns Resultado de la operación
 */
export async function saveSeo(
  collectionName: string,
  documentId: string,
  seoData: SeoData,
  lang: string = "es",
): Promise<SaveSeoResult> {
  try {
    const db = getFirestore();
    const docRef = db.collection(collectionName).doc(documentId);

    const writeResult = await docRef.update({
      [`translations.${lang}.seo`]: seoData,
      updatedAt: new Date(),
    });

    return {
      success: true,
      documentId,
      updateTime: writeResult.writeTime.toDate().toISOString(),
    };
  } catch (error) {
    console.error("Error al guardar SEO:", error);

    // Firestore adjunta un `code` a sus errores; no está en el tipo `Error` estándar.
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "unknown";

    return {
      success: false,
      documentId,
      error: getErrorMessage(error, "Error desconocido"),
      errorCode,
      errorDetails: error,
    };
  }
}
