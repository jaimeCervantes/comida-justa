/**
 * El proveedor de traducción no pudo contestar, o contestó algo que no sirve.
 *
 * Es un error **esperado**, no excepcional: publicar no puede depender de que Gemini responda. Se
 * captura donde se dispara la traducción y la fila queda pendiente para el backfill.
 */
export default class TranslationProviderError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "TranslationProviderError";
    this.cause = cause;
  }
}
