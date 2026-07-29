"use client";

import { forwardRef, useId, useState } from "react";
import { MdError } from "react-icons/md";
import type { ComponentPropsWithRef } from "react";
import { FieldHelper } from "./FieldHelper";
import { FieldLabel } from "./FieldLabel";
import { cn } from "../styling/merge-class-names";

export type TextAreaProps = Omit<ComponentPropsWithRef<"textarea">, "id"> & {
  id?: string;
  label?: string;
  error?: string | boolean | null;
  hint?: string;
  containerClassName?: string;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  {
    id: providedId,
    label,
    error,
    hint,
    disabled,
    required,
    className,
    containerClassName,
    maxLength = 250,
    rows = 4,
    onChange,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const hasError = Boolean(error);
  const describedBy = (error ?? hint) ? `${id}-helper` : undefined;
  
  const [textLength, setTextLength] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextLength(e.target.value.length);
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className={cn("flex flex-col mt-6", containerClassName)}>
      {label && (
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
      )}

      <textarea
        ref={ref}
        id={id}
        rows={rows}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        onChange={handleChange}
        aria-describedby={describedBy}
        aria-invalid={hasError ? true : undefined}
        className={cn(
          "w-full rounded-md px-3 py-2 text-text-base border bg-surface-elevation-1 transition-colors duration-fast ease-standard outline-none placeholder:text-text-support disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-elevation-2",
          hasError
            ? "border-feedback-error focus-visible:ring-1 focus-visible:ring-feedback-error"
            : "border-border focus-visible:border-brand-green focus-visible:ring-1 focus-visible:ring-brand-green",
          className
        )}
        {...props}
      />

      {hasError ? (
        <FieldHelper id={describedBy} tone="error">
          <MdError aria-hidden="true" className="size-4" />
          {typeof error === "string" ? error : "Este campo es requerido o inválido"}
        </FieldHelper>
      ) : (
        <span className="block text-right mt-1 text-sm text-text-support">
          {textLength}/{maxLength}
        </span>
      )}
      
      {/* Support for legacy children if any */}
      {(props as any).children}
    </div>
  );
});
