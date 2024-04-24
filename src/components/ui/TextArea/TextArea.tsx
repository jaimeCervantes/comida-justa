"use client";
import { useState, useId } from "react";
import type { ForwardedRef, ReactNode } from "react";
import { MdError } from "react-icons/md";

type TextAreaProps = Partial<{
  name: string;
  label: string;
  maxLength: number;
  placeholder: string;
  className: string;
  rows: number;
  error: boolean | string;
  ref: ForwardedRef<any>;
  required: boolean;
  children: ReactNode;
}>;

const inputClassName =
  "w-full rounded border border-black focus:border-pw-green focus:outline focus:outline-pw-green px-2 py-1 dark:text-white bg-pw-gray";
const errorClassName =
  "pt-1 flex items-center gap-1 text-red-700 dark:text-red-400";

/* eslint-disable react/prop-types */
export default function TextArea({
  label,
  maxLength,
  placeholder,
  className,
  rows,
  error,
  ref,
  name,
  required,
  children,
  ...moreProps
}: TextAreaProps) {
  const [text, setText] = useState("");
  const id = useId();
  const textAreaId = id + name;

  return (
    <div className="mt-6">
      {label && (
        <label htmlFor={textAreaId} className="block">
          {label}
        </label>
      )}
      <textarea
        id={textAreaId}
        ref={ref}
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
}
