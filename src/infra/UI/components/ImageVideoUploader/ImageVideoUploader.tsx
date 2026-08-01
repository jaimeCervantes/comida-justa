import { useEffect } from "react";
import ImageVideoPicker from "~/infra/UI/components/ImageVideoPicker";
import type {
  ImageVideoPickerProps,
  InputFiles,
} from "~/infra/UI/components/ImageVideoPicker/types";
import useStorageUpload from "~/infra/UI/hooks/useStorageUpload";

/** Lo que el uploader reporta hacia arriba cuando la subida termina. */
export type UploadedMediaResult = {
  media: Record<string, string> | null;
  isLoading: boolean;
  isCompleted: boolean;
};

type ImageVideoUploaderProps = Omit<ImageVideoPickerProps, "onChange"> & {
  onUploaded: (params: UploadedMediaResult | null) => void;
  /** Carpeta de Cloud Storage. `posts` para publicaciones, `sellers` para el logo de una tienda. */
  directory?: string;
};

/**
 * Vive en `infra/UI` y no dentro de `/publicar` porque tiene dos consumidores: el formulario de
 * publicación y la ficha de la tienda.
 */
export default function ImageVideoUploader({
  label,
  name,
  onUploaded,
  accept,
  required,
  className,
  directory = "posts",
}: ImageVideoUploaderProps) {
  const { uploadFile, progress, isLoading, media, error, isCompleted } =
    useStorageUpload({ directory });

  const handleUpload = async (files: InputFiles) => {
    const file = files?.item(0);
    if (file) {
      await uploadFile(file);
    }
  };

  useEffect(() => {
    if (!isLoading && isCompleted && media?.url) {
      onUploaded({ media, isLoading, isCompleted });
    }
  }, [isLoading, isCompleted, media, onUploaded]);

  return (
    <div className={className}>
      <ImageVideoPicker
        name={name}
        label={label}
        onChange={handleUpload}
        error={error}
        accept={accept}
        required={required}
        disabled={isLoading}
      />
      {isLoading && <p>⏳ Subiendo... {progress.toFixed(0)}%</p>}
      {media?.url && <p>✅ Subido: </p>}
    </div>
  );
}
