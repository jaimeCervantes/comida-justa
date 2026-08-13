import { useEffect } from "react";
import useStorageUpload, {
  type UploadedMedia,
} from "~/infra/UI/hooks/useStorageUpload";
import ImageVideoPicker from "~/presentation/media/ImageVideoPicker";
import type {
  ImageVideoPickerProps,
  InputFiles,
} from "~/presentation/media/ImageVideoPicker/types";

/** Lo que el uploader reporta hacia arriba cuando la tanda termina. */
export type UploadedMediaResult = {
  /** Los archivos de **esta** tanda, en el orden en que se eligieron. Quien acumula es el llamador. */
  media: UploadedMedia[];
  isLoading: boolean;
  isCompleted: boolean;
};

type ImageVideoUploaderProps = Omit<ImageVideoPickerProps, "onChange"> & {
  onUploaded: (params: UploadedMediaResult | null) => void;
  /** Carpeta de Cloud Storage. `posts` para publicaciones, `sellers` para el logo de una tienda. */
  directory?: string;
  /**
   * Cuántos archivos caben todavía. Con `multiple`, una selección más larga se recorta a este
   * número en vez de rechazarse entera: quien elige doce fotos de la galería del teléfono no quiere
   * un error, quiere las que quepan.
   */
  remaining?: number;
  /** Texto del progreso, ya traducido: este componente no habla con el catálogo. */
  uploadingLabel?: (progress: number) => string;
  /** Confirmación de la tanda, ya traducida. Recibe cuántos archivos subieron. */
  uploadedLabel?: (count: number) => string;
};

/**
 * Vive en `presentation/media` y no dentro de `/publicar` porque tiene dos consumidores: el
 * formulario de publicación —donde se suben varios— y la ficha de la tienda, donde el logo es uno.
 */
export default function ImageVideoUploader({
  label,
  name,
  onUploaded,
  accept,
  required,
  className,
  directory = "posts",
  multiple = false,
  remaining,
  uploadingLabel,
  uploadedLabel,
}: ImageVideoUploaderProps) {
  const { uploadFiles, progress, isLoading, media, error, isCompleted } =
    useStorageUpload({ directory });

  const handleUpload = async (files: InputFiles) => {
    if (!files || files.length === 0) return;

    /* Antes era `files.item(0)`: el input aceptaba varios —`multiple` ya existía en las props del
       picker— y el uploader tiraba todos menos el primero sin decirlo. */
    const chosen = Array.from(files);
    const limit = multiple ? (remaining ?? chosen.length) : 1;

    await uploadFiles(chosen.slice(0, Math.max(0, limit)));
  };

  useEffect(() => {
    if (!isLoading && isCompleted && media.length > 0) {
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
        multiple={multiple}
        disabled={isLoading || remaining === 0}
      />
      {isLoading && (
        <p>
          {uploadingLabel
            ? uploadingLabel(progress)
            : `⏳ Subiendo... ${progress.toFixed(0)}%`}
        </p>
      )}
      {/* La confirmación de que la tanda terminó. No es decorativa: tres page objects de Playwright
          esperan este texto antes de enviar el formulario, porque es la única señal de que la
          subida acabó y el campo oculto ya lleva algo. */}
      {!isLoading && media.length > 0 && (
        <p data-testid="media-uploaded">
          {uploadedLabel ? uploadedLabel(media.length) : "✅ Subido"}
        </p>
      )}
    </div>
  );
}
