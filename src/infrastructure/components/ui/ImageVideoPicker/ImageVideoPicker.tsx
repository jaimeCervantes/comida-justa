"use client";
import { useState, useId, useRef, forwardRef, useImperativeHandle } from "react";
import type { ForwardedRef } from "react";
import Button from "../Button/Button";
import { MdImage as MdImageIcon } from "react-icons/md";
import type { ImageVideoPickerProps } from "./ImageVideoPicker.d";
import { MdError } from "react-icons/md";

import styles from "./ImageVideoPicker.module.css";

type ImageVideoPickerRefType = {
  scrollIntoView: (options?: boolean | ScrollIntoViewOptions) => void;
};

export type { ImageVideoPickerRefType };

export const errorClassName =
  "pt-1 flex items-center gap-1 text-red-700 dark:text-red-400";

const ImagePicker = forwardRef(function ImagePicker({
  label,
  name,
  className,
  onChange,
  error,
  required,
  accept,
  multiple,
}: ImageVideoPickerProps, 
ref: ForwardedRef<ImageVideoPickerRefType>
){
  const [fileName, setFileName] = useState<string>("");
  const [srcFile, setSrcFile] = useState<string>("");
  const [fileType, setFileType] = useState<string>("");
  const fileInput = useRef<HTMLInputElement | null>(null);
  useImperativeHandle(ref, () => ({
     scrollIntoView: (options) => fileInput.current?.scrollIntoView(options),
  }));
  const id = useId();
  const inputId = `${id}-${name}`;

  function readFile(files: FileList | null) {
    if (files === null) return;
    const file = files[0];
    const reader = new FileReader();

    setFileName(file.name);
    setFileType(file.type);

    reader.onload = onReadingCompleted;
    reader.readAsDataURL(file!);
  }

  function onReadingCompleted(evt: ProgressEvent<FileReader>) {
    const fileUrl = evt.target?.result;
    if (fileUrl) {
      setSrcFile(fileUrl as string);
    }
  }

  const isImage = fileType.startsWith("image/");
  const isVideo = fileType.startsWith("video/")

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
          />
          {label}
        </Button>
      </label>

      {error && (
        <div aria-label="iconError" className={errorClassName}>
          <MdError />
          {error}
        </div>
      )}

      <footer className="flex flex-col items-center justify-start gap-4 mt-4">
        {srcFile && isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={srcFile} alt={fileName} className={styles.ImagePreview} />
        )}

        {srcFile && isVideo && (
          <video
            role="video"
            controls
            src={srcFile}
            className={styles.ImagePreview}
          >
            Tu navegador no soporta HTML5
          </video>
        )}

        {fileName && <span className="text-sm text-gray-600">{fileName}</span>}
      </footer>
    </section>
  );
});


export default ImagePicker;

