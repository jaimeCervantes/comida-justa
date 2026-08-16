/**
 * El clasificador no pudo juzgar, o contestó algo que no sirve.
 *
 * Es un error **esperado**, no excepcional: publicar no puede depender de que Gemini responda. Se
 * captura donde se dispara la revisión y la publicación queda `in_review`, que es donde el panel
 * del slice 1 ya sabe mirar.
 */
export default class ModerationProviderError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ModerationProviderError";
    this.cause = cause;
  }
}
