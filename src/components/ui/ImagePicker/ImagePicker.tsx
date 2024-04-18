"use client";
import { useState, useId, useRef } from "react";
import Button from "../Button/Button";
import { MdImage as MdImageIcon } from "react-icons/md";
import type { ImagePickerProps } from "./ImagePicker.d";

import styles from "./ImagePicker.module.css";

export default function ImagePicker({
  label,
  name,
  onChange,
  ...moreProps
}: ImagePickerProps) {
  const [fileName, setFileName] = useState<string>("");
  const [srcImage, setSrcImage] = useState<string>("");
  const fileInput = useRef(null as HTMLInputElement | null);
  const id = useId();
  const inputId = `${id}-${name}`;

  function readFile(files: FileList | null) {
    if (files === null) return;
    const file = files[0];
    const reader = new FileReader();

    setFileName(file.name);

    reader.onload = onReadingCompleted;
    reader.readAsDataURL(file!);
  }

  function onReadingCompleted(evt: ProgressEvent<FileReader>) {
    const imageUrl = evt.target?.result;
    if (imageUrl) {
      setSrcImage(imageUrl as string);
    }
  }

  return (
    <section>
      <label htmlFor={inputId}>
        <Button startIcon={<MdImageIcon size={32} color={"white"} />}>
          <input
            className="opacity-0 absolute w-full h-full top-0 left-0"
            ref={fileInput}
            name={name}
            id={inputId}
            type="file"
            accept="image/*"
            onChange={(e) => {
              readFile(e.target.files);
              onChange?.(e.target.files);
            }}
            {...moreProps}
          />
          {label}
        </Button>
      </label>

      <footer className="flex flex-col items-center justify-start gap-4">
        {srcImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={srcImage} alt={srcImage} className={styles.ImagePreview} />
        )}

        {fileName}
      </footer>
    </section>
  );
}
