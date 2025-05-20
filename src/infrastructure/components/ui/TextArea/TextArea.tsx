"use client";
import { useState, useId, forwardRef, useImperativeHandle, useRef  } from "react";
import type { ForwardedRef, ReactNode } from "react";
import { MdError } from "react-icons/md";

export type TextAreaRefType = {
  focus: () => void;
  blur: () => void;
  scrollIntoView: (options?: boolean | ScrollIntoViewOptions) => void;
  value: string;
};

type TextAreaProps = {
  name?: string;
  label?: string;
  maxLength?: number;
  placeholder?: string;
  className?: string;
  rows?: number;
  error?: boolean | string;
  required?: boolean;
  children?: ReactNode;
};

const inputClassName =
  "w-full rounded border border-black focus:border-pw-green focus:outline focus:outline-pw-green px-2 py-1 dark:text-white bg-pw-gray";
const errorClassName =
  "pt-1 flex items-center gap-1 text-red-700 dark:text-red-400";

/* eslint-disable react/prop-types */
const TextArea = forwardRef<TextAreaRefType, TextAreaProps>(function TextAreaInner(
  {
  label,
  maxLength,
  placeholder,
  className,
  rows,
  error,
  name,
  required,
  children,
  ...moreProps
}: TextAreaProps,
  ref: ForwardedRef<TextAreaRefType>
 ) {
  const [text, setText] = useState("");
  const id = useId();
  const textAreaId = id + (name ?? "");
  const innerRef = useRef<HTMLTextAreaElement>(null);

 useImperativeHandle(ref, () => ({
    focus: () => innerRef.current?.focus(),
    blur: () => innerRef.current?.blur(),
    scrollIntoView: (options?: boolean | ScrollIntoViewOptions) =>
      innerRef.current?.scrollIntoView(options),
    value: innerRef.current?.value ?? "",
  }));

  return (
    <div className="mt-6">
      {label && (
        <label htmlFor={textAreaId} className="block">
          {label}
        </label>
      )}
      <textarea
        id={textAreaId}
        ref={innerRef}
        required={required || false}
        onChange={(evt) => setText(evt.target.value)}
        className={`${inputClassName} ${className ?? ""}`}
        name={name}
        maxLength={maxLength || 250}
        placeholder={placeholder}
        {...moreProps}
        rows={rows}
      ></textarea>

      {error ? (
        <div className={errorClassName}>
          <MdError />
          {error}
        </div>
      ) : (
        <span className="block mb-2 text-right mt-1 text-gray-500">
          {text.length}/{maxLength || 250}
        </span>
      )}
      {children}
    </div>
  );
});

export default TextArea;