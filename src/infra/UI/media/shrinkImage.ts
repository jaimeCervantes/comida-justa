/**
 * Encoger la imagen **antes** de subirla.
 *
 * Una foto de un teléfono actual son 4000×3000 y entre 3 y 8 MB, y el sitio no la enseña nunca a más
 * de unos 800 px de ancho. Subirla entera se paga tres veces: el disco de Cloud Storage, los datos
 * móviles de quien publica —que es quien menos puede pagarlos— y el trabajo del optimizador de Next,
 * que se descarga ese original para reducirlo en cada tamaño que sirve.
 *
 * **Lo que se sube es lo que se guarda para siempre**, así que el tope de aquí no es el tamaño con el
 * que se ve: es el techo de calidad del que se podrá tirar después. Por eso 2048 y no 800.
 */

/**
 * El lado más largo que se conserva.
 *
 * 2048 deja margen de sobra sobre lo que se sirve hoy —la variante más grande que pide cualquiera de
 * los diseños actuales anda por 1920— y sobre una pantalla de alta densidad mirando la vista grande.
 * Bajar de aquí empezaría a notarse al ampliar; subir deja de ahorrar.
 */
export const MAX_UPLOAD_EDGE = 2048;

/** Alto para una foto, e indistinguible del original a simple vista. Por debajo aparecen artefactos. */
export const UPLOAD_QUALITY = 0.82;

/**
 * WebP y no JPEG: pesa entre un 25 % y un 35 % menos con la misma calidad **y conserva la
 * transparencia**, así que un PNG con fondo transparente no se convierte en un rectángulo blanco.
 * Todos los navegadores que soporta el sitio saben codificarlo desde un `canvas`.
 */
const TARGET_TYPE = "image/webp";

/**
 * Los que no se tocan.
 *
 * - Un GIF pierde la animación al pasar por un `canvas`, que solo sabe del primer fotograma.
 * - Un SVG es texto: redibujarlo lo convierte en píxeles, o sea lo empeora en todo.
 * - Un vídeo no cabe aquí (ver la nota del final del archivo).
 */
const UNTOUCHED = ["image/gif", "image/svg+xml"];

export interface ShrunkImage {
  /** El que hay que subir: el reducido, o el original si no había nada que ganar. */
  file: File;
  /** Del archivo que se va a subir, no del que se eligió. Ausentes si no se pudo decodificar. */
  width?: number;
  height?: number;
}

/**
 * Cuánto hay que encoger, o nada.
 *
 * Devuelve `null` cuando ya cabe: **nunca se agranda**. Estirar una foto pequeña no le añade
 * información, solo peso, y la dejaría peor de lo que estaba.
 *
 * Se conserva la proporción y se redondea, porque un `canvas` de 1365.33 px no existe.
 */
export function planResize(
  width: number,
  height: number,
  maxEdge: number = MAX_UPLOAD_EDGE,
): { width: number; height: number } | null {
  const longest = Math.max(width, height);

  if (longest <= maxEdge) return null;

  const ratio = maxEdge / longest;

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/** `foto.jpg` sube como `foto.webp`: el nombre no puede decir una cosa y el contenido otra. */
function renameTo(name: string, type: string): string {
  const extension = type.split("/")[1];

  return `${name.replace(/\.[^./\\]+$/, "")}.${extension}`;
}

/**
 * La imagen lista para subir.
 *
 * **Nunca lanza y nunca bloquea.** Ante cualquier problema —un formato que el navegador no
 * decodifica, un `canvas` que no da contexto, un entorno sin `createImageBitmap`— devuelve el archivo
 * original: publicar no puede fallar porque un ahorro no salga. Es la misma regla que `readImageSize`.
 *
 * Tampoco sube lo que le hizo el trabajo peor: si al recodificar el resultado pesa igual o más que el
 * original —pasa con las imágenes ya optimizadas y con las muy pequeñas—, se queda el original.
 */
export async function shrinkImageForUpload(file: File): Promise<ShrunkImage> {
  if (!file.type.startsWith("image/") || UNTOUCHED.includes(file.type)) {
    return { file };
  }

  if (typeof createImageBitmap !== "function") return { file };

  try {
    /* `from-image` respeta la orientación EXIF. Sin esto, las fotos hechas en vertical con el
       teléfono suben acostadas: el sensor guarda los píxeles girados y la etiqueta EXIF es la que
       dice cómo mirarlos, y esa etiqueta se pierde al redibujar. */
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });

    const target = planResize(bitmap.width, bitmap.height) ?? {
      width: bitmap.width,
      height: bitmap.height,
    };

    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;

    const context = canvas.getContext("2d");

    if (!context) return { file, width: bitmap.width, height: bitmap.height };

    context.drawImage(bitmap, 0, 0, target.width, target.height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, TARGET_TYPE, UPLOAD_QUALITY);
    });

    if (!blob || blob.size >= file.size) {
      return { file, width: bitmap.width, height: bitmap.height };
    }

    return {
      file: new File([blob], renameTo(file.name, TARGET_TYPE), {
        type: TARGET_TYPE,
      }),
      ...target,
    };
  } catch {
    return { file };
  }
}

/*
 * ¿Y el vídeo?
 *
 * No se puede hacer aquí, y conviene que quede escrito para que nadie lo intente dos veces. Recodificar
 * vídeo en el navegador exige un códec: `ffmpeg.wasm` son unos 25 MB que habría que descargar antes de
 * subir nada, y un teléfono de gama media tarda más en recodificar un vídeo de un minuto que en
 * subirlo tal cual. La `WebCodecs API` lo haría bien pero no está en Safari en las versiones que
 * usa buena parte de la comunidad.
 *
 * Las dos salidas reales son de producto, no de código: poner un tope de tamaño o duración y decirlo
 * al elegir el archivo, o recodificar del lado del servidor con un trabajo aparte. Ver la bitácora.
 */
