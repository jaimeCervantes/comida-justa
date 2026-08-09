/**
 * Lo que se puede afirmar tras mirar el archivo.
 *
 * Más estrecho que `MediaDimensions`, que es lo que sale de la **base** y admite nulos porque la
 * columna los admite. De aquí solo salen números de verdad o nada: medir no produce un `null`,
 * produce una medida o ninguna.
 */
export interface ImageSize {
  width?: number;
  height?: number;
}

/**
 * Ancho y alto de un archivo **antes de subirlo**, leídos por el navegador.
 *
 * Es lo que evita que lo que se publique desde ahora nazca sin dimensiones y acabe recortado junto
 * a lo que sí las tiene. El servidor no puede hacerlo: cuando le llega la petición ya solo tiene
 * una URL, y medirla obligaría a descargar el archivo que el navegador acaba de tener en la mano.
 *
 * **Solo imágenes.** Un vídeo se mediría con un elemento `<video>` y su `loadedmetadata`, pero hoy
 * se pintan con `aspect-video` fijo y guardar unas dimensiones que nadie lee sería código muerto.
 *
 * **Nunca lanza.** Devuelve `{}` ante cualquier problema —formato que el navegador no decodifica,
 * `createImageBitmap` ausente, un archivo corrupto—, y `{}` significa «no lo sabemos», que es un
 * valor legítimo en la base. Publicar no puede fallar porque una medición no salga.
 */
export async function readImageSize(file: File): Promise<ImageSize> {
  if (!file.type.startsWith("image/")) return {};

  const fromBitmap = await sizeFromBitmap(file);
  if (fromBitmap) return fromBitmap;

  return (await sizeFromElement(file)) ?? {};
}

/** La vía directa. Decodifica fuera del hilo principal y no ensucia el DOM. */
async function sizeFromBitmap(file: File): Promise<ImageSize | null> {
  if (typeof createImageBitmap !== "function") return null;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    // Libera la memoria de la copia decodificada; sin esto una sesión de publicación la acumula.
    bitmap.close?.();

    return width > 0 && height > 0 ? { width, height } : null;
  } catch {
    return null;
  }
}

/**
 * El respaldo, para navegadores sin `createImageBitmap` o formatos que este rechaza.
 *
 * El `URL.revokeObjectURL` va en los dos caminos: sin él, el objeto queda vivo hasta que se
 * descargue el documento entero.
 */
function sizeFromElement(file: File): Promise<ImageSize | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = image;
      URL.revokeObjectURL(objectUrl);
      resolve(width > 0 && height > 0 ? { width, height } : null);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    image.src = objectUrl;
  });
}
