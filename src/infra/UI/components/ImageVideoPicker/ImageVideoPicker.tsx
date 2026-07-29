"use client";
import { useId, useRef, useState } from "react";
import { MdError, MdImage as MdImageIcon } from "react-icons/md";
import { Button } from "~/presentation/design_system/buttons/Button";
import styles from "./ImageVideoPicker.module.css";
import type { ImageVideoPickerProps } from "./types";

export const errorClassName =
  "pt-1 flex items-center gap-1 text-red-700 dark:text-red-400";

export default function ImagePicker({
  label,
  name,
  className,
  onChange,
  error,
  required,
  accept,
  multiple,
  disabled = false,
}: ImageVideoPickerProps) {
  const [fileName, setFileName] = useState<string>("");
  const [srcFile, setSrcFile] = useState<string>("");
  const [fileType, setFileType] = useState<string>("");
  const fileInput = useRef(null as HTMLInputElement | null);
  const id = useId();
  const inputId = `${id}-${name}`;

  function readFile(files: FileList | null) {
    if (files === null) return;
    const file = files.item(0);
    if (file === null) return;
    const reader = new FileReader();

    setFileName(file.name);
    setFileType(file.type);

    reader.onload = onReadingCompleted;
    reader.readAsDataURL(file);
  }

  function onReadingCompleted(evt: ProgressEvent<FileReader>) {
    const fileUrl = evt.target?.result;
    if (fileUrl) {
      setSrcFile(fileUrl as string);
    }
  }

  const isImage = fileType.startsWith("image/");
  const isVideo = fileType.startsWith("video/");

  return (
    <section className={className}>
      <label htmlFor={inputId}>
        <Button startIcon={<MdImageIcon size={32} color={"white"} />} size="sm">
          <input
            className="opacity-0 absolute w-full h-full top-0 left-0 cursor-pointer [&::-webkit-file-upload-button]:cursor-pointer"
            required={required}
            ref={fileInput}
            name={name}
            id={inputId}
            type="file"
            accept={accept}
            onChange={(e) => {
              readFile(e.target.files);
              onChange?.(e.target.files);
            }}
            multiple={multiple}
            aria-label={label}
            disabled={disabled}
          />
          {label}
        </Button>
      </label>

      {error && (
        <div role="alert" aria-label="iconError" className={errorClassName}>
          <MdError />
          {error}
        </div>
      )}

      <footer className="flex flex-col items-center justify-start gap-4 mt-4">
        {srcFile && isImage && (
          // Es una vista previa local: `srcFile` es un data URL del FileReader, que `next/image`
          // no puede optimizar. `<img>` es lo correcto aquí.
          // eslint-disable-next-line @next/next/no-img-element
          // biome-ignore lint/performance/noImgElement: vista previa local con data URL, no optimizable por next/image.
          <img src={srcFile} alt={fileName} className={styles.ImagePreview} />
        )}

        {srcFile && isVideo && (
          // biome-ignore lint/a11y/useMediaCaption: vista previa del video que acaba de elegir la persona usuaria; no existe pista de subtítulos.
          <video controls src={srcFile} className={styles.ImagePreview}>
            Tu navegador no soporta HTML5
          </video>
        )}

        {fileName && <span className="text-sm text-gray-600">{fileName}</span>}
      </footer>
    </section>
  );
}
