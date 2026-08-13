"use client";

import { useState } from "react";
import { readImageSize } from "~/infra/UI/media/readImageSize";
import { shrinkImageForUpload } from "~/infra/UI/media/shrinkImage";

interface useStorageUpload {
  directory?: string;
}

/**
 * Lo que queda de un archivo ya subido.
 *
 * Era un `Record<string, string>`, y con él las dimensiones no cabían sin convertirlas a texto para
 * volver a parsearlas al otro lado. Tipado, quien lo recibe sabe qué hay y qué puede faltar.
 */
export interface UploadedMedia {
  url: string;
  /** El MIME del archivo (`image/jpeg`); quien lo guarda se queda con la primera mitad. */
  type: string;
  path: string;
  /** Del propio archivo, antes de subirlo. Ausentes en un vídeo o si la medición falla. */
  width?: number;
  height?: number;
}

/**
 * El nombre con el que el archivo aterriza en Cloud Storage.
 *
 * Era `${Date.now()}-${file.name}`, y con un solo archivo por publicación eso bastaba. Subiendo
 * varios de una vez deja de bastar: dos fotos llamadas `IMG_0001.jpg` —el caso normal al elegir
 * varias de la galería del teléfono— entran en el mismo milisegundo y **la segunda sobrescribe a la
 * primera**, así que la publicación acaba con dos filas apuntando al mismo archivo. El sufijo
 * aleatorio las separa sin perder el orden que da la marca de tiempo.
 */
function storageFileName(file: File): string {
  const discriminator = crypto.randomUUID().slice(0, 8);

  return `${Date.now()}-${discriminator}-${file.name}`;
}

export default function useStorageUpload(options: useStorageUpload = {}) {
  const [progress, setProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  /** Un archivo: lo encoge, pide la URL firmada, sube y lo hace público. Lanza si algo falla. */
  const uploadOne = async (original: File): Promise<UploadedMedia> => {
    /* 0. Encogerlo, si es una imagen y hay algo que ganar.
       Antes de pedir la URL firmada, porque la petición lleva dentro el nombre y el tipo del
       archivo, y tras recodificar a WebP los dos cambian. Si no hay nada que ganar —un vídeo, un
       GIF, una foto ya pequeña— devuelve el mismo archivo y esto no cuesta nada. */
    const { file, width, height } = await shrinkImageForUpload(original);

    // 1. Obtener URL firmada desde el servidor
    const response = await fetch("/api/storage/signed-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: storageFileName(file),
        contentType: file.type,
        directory: options.directory || "posts",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al obtener URL firmada");
    }

    const { uploadUrl, filePath } = await response.json();

    // 2. Subir el archivo usando XMLHttpRequest para poder monitorear el progreso
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP Error: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Error de red durante la subida"));
      };

      xhr.send(file);
    });

    // 3. Hacer el archivo público
    const res = await fetch("/api/storage/read-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: filePath }),
    });

    // i18n-ignore: error interno; lo que ve el visitante lo decide quien captura.
    if (!res.ok) throw new Error("Error al hacer público");

    const data = await res.json();

    /* 4. Guardar la URL pública y la forma del archivo.
       Se mide en el navegador y no en el servidor porque **este es el único momento en que el
       archivo está en la mano**: a la Server Action le llega solo una URL, y medirla la obligaría a
       descargar lo que el navegador acaba de subir. Si falla no devuelve nada, porque publicar no
       puede depender de esto.

       Las medidas son **las del archivo que se subió**, no las del que se eligió: encoger cambia los
       dos números, y guardar los del original haría que la ficha reservara un hueco con la
       proporción correcta pero el tamaño equivocado. Encoger ya las devuelve —acaba de dibujarlas—,
       así que solo se vuelve a medir cuando no las trae: un archivo que no se pudo decodificar, o
       uno que no pasó por ahí. */
    const size =
      width && height ? { width, height } : await readImageSize(file);

    return {
      url: data.publicUrl,
      type: file.type,
      path: filePath,
      ...size,
    };
  };

  /**
   * Varios archivos, **uno detrás de otro**.
   *
   * En serie y no en paralelo por dos razones. La primera es el progreso: hay una sola barra, y en
   * paralelo mostraría el porcentaje del último `onprogress` que llegara, o sea un número que sube y
   * baja sin significar nada. La segunda es la red de quien publica desde el teléfono: tres vídeos a
   * la vez compiten por el mismo ancho de banda y terminan más tarde que en fila.
   *
   * `media` es **lo subido en esta tanda**, no todo lo que la persona lleva elegido: acumular entre
   * tandas es cosa de quien tiene la lista —el formulario de publicar—, porque el otro consumidor no
   * quiere acumular nada. El logo de una tienda es uno y solo uno, y un hook que sumara dejaría a
   * `media[0]` valiendo para siempre el primer logo que se subió.
   *
   * Dentro de la tanda sí se conserva lo que ya salió bien: si el tercero falla, los dos primeros
   * siguen ahí y la persona reintenta solo lo que falta en vez de volver a empezar.
   */
  const uploadFiles = async (files: File[]): Promise<UploadedMedia[]> => {
    if (files.length === 0) return [];

    setProgress(0);
    setIsLoading(true);
    setMedia([]);
    setError(null);
    setIsCompleted(false);

    const uploaded: UploadedMedia[] = [];

    try {
      for (const file of files) {
        setProgress(0);
        uploaded.push(await uploadOne(file));
        setMedia((current) => [...current, uploaded[uploaded.length - 1]]);
      }

      setIsCompleted(true);
      setProgress(100);
    } catch (err) {
      console.error("Error en el proceso de subida:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }

    return uploaded;
  };

  /** Un solo archivo. Lo usa el logo de la tienda, donde no hay lista que acumular. */
  const uploadFile = async (file: File): Promise<UploadedMedia[]> =>
    uploadFiles([file]);

  return {
    uploadFile,
    uploadFiles,
    progress,
    isCompleted,
    isLoading,
    media,
    error,
  };
}
