import classNames from "classnames";
import { on } from "events";
import { useCallback, useEffect } from "react";
import ImageVideoPicker from "~/infra/UI/components/ImageVideoPicker";
import type {
  ImageVideoPickerProps,
  InputFiles,
} from "~/infra/UI/components/ImageVideoPicker/types";
import useStorageUpload from "./hooks/useStorageUpload";

type ImageVideoUploaderProps = Omit<ImageVideoPickerProps, "onChange"> & {
  onUploaded: (params: Record<string, any> | null) => void;
};

export default function ImageVideoUploader({
  label,
  name,
  onUploaded,
  accept,
  required,
  className,
}: ImageVideoUploaderProps) {
  const { uploadFile, progress, isLoading, media, error, isCompleted } =
    useStorageUpload({
      directory: "posts",
    });

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
