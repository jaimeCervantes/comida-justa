"use client";

import { useState } from "react";

interface useStorageUpload {
  directory?: string;
}

export default function useStorageUpload(options: useStorageUpload = {}) {
  const [progress, setProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [media, setMedia] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const uploadFileWithProgress = async (file: File) => {
    setProgress(0);
    setIsLoading(true);
    setMedia(null);
    setError(null);
    setIsCompleted(false);

    try {
      // 1. Obtener URL firmada desde el servidor
      const response = await fetch("/api/storage/signed-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: `${Date.now()}-${file.name}`,
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
      // i18n-ignore: traza de desarrollo.
      console.log("🌍 Archivo público:", data.publicUrl);

      // 4. Guardar la URL pública en el estado
      setMedia({
        url: data.publicUrl,
        type: file.type,
        path: filePath,
      });
      setIsCompleted(true);
      setProgress(100);
    } catch (err) {
      console.error("Error en el proceso de subida:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadFile: uploadFileWithProgress,
    progress,
    isCompleted,
    isLoading,
    media,
    error,
  };
}
