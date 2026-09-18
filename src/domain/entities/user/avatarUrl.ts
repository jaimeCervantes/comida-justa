const GOOGLE_AVATAR_SIZE_SUFFIX = /=s\d+-c$/;

/**
 * Google entrega el avatar recortado a 96px («…=s96-c» al final de la URL). Servido tal cual en un
 * hueco que en escritorio mide varios cientos de píxeles de lado —la mitad de `PracticeCover`—, el
 * navegador lo estira y se ve borroso/distorsionado.
 *
 * El sufijo `=sNN-c` es el propio protocolo de imágenes de Google para pedir un recorte cuadrado de
 * NN píxeles; cambiar el número pide el mismo recorte en un tamaño mayor, sin subir ni guardar nada
 * nuevo. Una URL que no lleve ese sufijo (otro proveedor, una foto subida a mano) se devuelve tal
 * cual: no hay nada que reescribir de forma segura.
 */
export function largeGoogleAvatarUrl(
  url: string | null | undefined,
  size: number,
): string | null | undefined {
  if (!url || !GOOGLE_AVATAR_SIZE_SUFFIX.test(url)) return url;

  return url.replace(GOOGLE_AVATAR_SIZE_SUFFIX, `=s${size}-c`);
}
