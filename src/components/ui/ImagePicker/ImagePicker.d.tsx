import { useState, useId, useRef } from "react";
export type InputFiles = FileList | null;

export type ImagePickerProps = Partial<{
  label: string;
  name: string;
  onChange: (files: InputFiles) => void;
  multiple: boolean;
  accept: string;
}>;
