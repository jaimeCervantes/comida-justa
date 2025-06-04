"use client";

import { useCallback, useEffect } from "react";
import classNames from "classnames";

import useStorageUpload from "./hooks/useStorageUpload";
import { useMediaUploader } from "./hooks/useMediaUploader";

import ImageVideoPicker from "~/infrastructure/UI/components/ImageVideoPicker";
import { InputFiles } from "~/infrastructure/UI/components/ImageVideoPicker/ImageVideoPicker.d";
import { MediaFile } from "./types/media.types";

interface BaseProps {
  label: string;
  name: string;
  onUploaded: (data: { media: MediaFile | null; isLoading: boolean; stats?: any } | null) => void;
  className?: string;
  accept: string;
  required?: boolean;
}

interface UploadProps extends BaseProps {
  mode: "upload";
}

interface CompressProps extends BaseProps {
  mode: "compress";
  maxVideoSize?: number;
  maxImageSize?: number;
}

type Props = UploadProps | CompressProps;

export default function ImageVideoUploader(props: Props) {
  const {
    label,
    name,
    onUploaded,
    className = "",
    accept,
    required = false,
  } = props;

  const isUploadMode = props.mode === "upload";

  // Storage upload mode
  const {
    uploadFile,
    progress: uploadProgress,
    isLoading: isUploading,
    media,
    error: uploadError,
    isCompleted,
  } = useStorageUpload({ directory: "posts" });

  // Compression mode
  const {
    processFile,
    isProcessing,
    progress: compressionProgress,
    error: compressionError,
    compressionStats,
    clearError,
  } = useMediaUploader({
    maxVideoSize: props.mode === "compress" ? props.maxVideoSize : undefined,
    maxImageSize: props.mode === "compress" ? props.maxImageSize : undefined,
  });

  const handleUploadMode = async (files: InputFiles) => {
    const file = files?.item(0);
    if (file) {
      await uploadFile(file);
    }
  };

  const handleCompressMode = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      clearError();
      onUploaded({ media: null, isLoading: true });

      const result = await processFile(file);

      onUploaded({
        media: result,
        isLoading: false,
        stats: compressionStats,
      });
    },
    [processFile, onUploaded, compressionStats, clearError]
  );

  useEffect(() => {
    if (isUploadMode && !isUploading && isCompleted && media?.url) {
      // Ensure media has the required MediaFile properties
      const { type, name, size, data } = media as unknown as MediaFile;
      onUploaded({ media: { type, name, size, data }, isLoading: isUploading });
    }
  }, [isUploading, isCompleted, media, onUploaded, isUploadMode]);

  return (
    <div className={classNames(className)}>
      {isUploadMode ? (
        <>
          <ImageVideoPicker
            name={name}
            label={label}
            onChange={handleUploadMode}
            error={uploadError}
            accept={accept}
            required={required}
            disabled={isUploading}
          />
          {isUploading && <p>⏳ Subiendo... {uploadProgress.toFixed(0)}%</p>}
          {media?.url && <p>✅ Subido correctamente</p>}
        </>
      ) : (
        <>
          <label className="block text-sm font-medium mb-2">{label}</label>
          <input
            type="file"
            accept={accept}
            onChange={handleCompressMode}
            required={required}
            disabled={isProcessing}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          {compressionError && (
            <p className="text-red-500 text-xs mt-1">{compressionError}</p>
          )}
          {isProcessing && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Optimizando archivo...</span>
                <span>{compressionProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${compressionProgress}%` }}
                />
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Máximo: {props.maxVideoSize ?? 120}MB videos,{" "}
            {props.maxImageSize ?? 10}MB imágenes
          </p>
        </>
      )}
    </div>
  );
}