import { getFirestore } from 'firebase-admin/firestore';

// Tipos para el SEO
type SeoMeta = {
  content: string;
  name: string;
};

type SeoData = {
  es: {
    title: string;
    metas: SeoMeta[];
  };
};

// Tipo para la respuesta de la función
type SaveSeoResult = {
  success: boolean;
  documentId: string;
  updateTime?: string;
  error?: string;
  errorCode?: string;
  errorDetails?: any;
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
  seoData: SeoData
): Promise<SaveSeoResult> {
  try {
    const db = getFirestore();
    const docRef = db.collection(collectionName).doc(documentId);

    // Actualizar el documento con la propiedad seo
    const writeResult = await docRef.update({
      seo: seoData,
      updatedAt: new Date() // Opcional: agregar timestamp de actualización
    });

    return {
      success: true,
      documentId,
      updateTime: writeResult.writeTime.toDate().toISOString() // Convertir a ISO string
    };

  } catch (error: any) {
    console.error('Error al guardar SEO:', error);
    
    return {
      success: false,
      documentId,
      error: error?.message || 'Error desconocido',
      errorCode: error?.code || 'unknown',
      errorDetails: error
    };
  }
}