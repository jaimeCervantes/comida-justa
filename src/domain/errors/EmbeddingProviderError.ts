/**
 * El proveedor de embeddings no devolvió un vector utilizable.
 *
 * Es un error **esperado**, no un bug: publicar no puede depender de que Gemini esté arriba, así
 * que quien lo atrapa guarda la publicación con `embedding = null` y la deja pendiente de indexar.
 */
export default class EmbeddingProviderError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "EmbeddingProviderError";
  }
}
