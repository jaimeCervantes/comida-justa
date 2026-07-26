import type { PostEmbeddingSource } from "~/domain/entities/post/embedding";

/** Una traducción concreta: el vector vive por idioma, no por publicación. */
export interface TranslationRef {
  postId: string;
  locale: string;
}

export default interface IPostEmbeddingRepository {
  /**
   * Lo que se vectoriza de una traducción. Devuelve `null` si la traducción no existe.
   * La implementación resuelve las claves de categoría a su etiqueta legible en español:
   * es el texto con el que el chatbot indexó su catálogo.
   */
  findEmbeddingSource(ref: TranslationRef): Promise<PostEmbeddingSource | null>;

  saveEmbedding(ref: TranslationRef, embedding: number[]): Promise<void>;

  /** Traducciones sin vector, las que el chatbot no puede ver. */
  findPendingIndexing(limit: number): Promise<TranslationRef[]>;
}
