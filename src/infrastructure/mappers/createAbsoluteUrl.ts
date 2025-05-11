import { PUBLIC_BASE_URL } from "~/infrastructure/constants";

export function createAbsoluteUrl(path: string) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }

  return `${PUBLIC_BASE_URL}${path}`; // Ejemplo con variable de entorno
}