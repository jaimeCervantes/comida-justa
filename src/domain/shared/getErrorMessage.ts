/**
 * Extrae el mensaje de un valor capturado en un `catch`. TypeScript tipa esa variable como
 * `unknown` (cualquier cosa puede lanzarse, no solo `Error`), así que se normaliza aquí en un
 * único lugar en vez de anotar `any` en cada `catch` del código.
 */
export default function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (typeof error === "string" && error) {
    return error;
  }

  // Cubre tanto `Error` como los objetos planos con `message` que devuelven Firestore y gRPC.
  if (typeof error === "object" && error !== null && "message" in error) {
    const { message } = error as { message: unknown };
    if (typeof message === "string" && message) {
      return message;
    }
  }

  return fallback;
}
