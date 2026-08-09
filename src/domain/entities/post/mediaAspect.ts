/**
 * Lo que se sabe de la forma de un archivo.
 *
 * Las dimensiones llegan de `post_media`, donde son nulables: son nulas para los 8 vídeos —medir
 * uno pediría `ffprobe`— y para todo lo que se publicó antes de que el formulario las capture.
 */
export interface MediaDimensions {
  width?: number | null;
  height?: number | null;
}

/**
 * La proporción real del archivo, o `null` cuando no se puede afirmar.
 *
 * **Hacen falta las dos.** Una sola no da proporción, y usarla a medias produciría un hueco peor
 * que el de hoy: `next/image` fija el alto a partir de los dos números, así que inventar el que
 * falta es exactamente la mentira que esta entrega viene a quitar —la de declarar cuadrada una
 * foto vertical—.
 *
 * El cero se descarta aquí y no solo en la base: el `CHECK` de la migración impide guardarlo, pero
 * este módulo también lo pintan datos que no vienen de ahí (una tarjeta armada a mano, un fixture),
 * y un `0` acabaría en una división por cero al calcular el alto.
 */
export function mediaAspectRatio({
  width,
  height,
}: MediaDimensions): number | null {
  if (!width || !height) return null;
  if (width <= 0 || height <= 0) return null;

  return width / height;
}

/** ¿Se puede pintar el archivo con su forma real, sin recortarlo? */
export function hasKnownAspect(dimensions: MediaDimensions): boolean {
  return mediaAspectRatio(dimensions) !== null;
}
