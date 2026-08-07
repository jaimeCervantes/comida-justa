"use client";

import type { ComponentPropsWithRef } from "react";
import { forwardRef, useId, useState } from "react";
import { MdError } from "react-icons/md";
import { cn } from "../styling/merge-class-names";
import { FieldHelper } from "./FieldHelper";
import { FieldLabel } from "./FieldLabel";

export type TextAreaProps = Omit<ComponentPropsWithRef<"textarea">, "id"> & {
  id?: string;
  label?: string;
  error?: string | boolean | null;
  /**
   * Qué decir cuando `error` es `true` y no una frase.
   *
   * Entra como prop y **no** se lee del catálogo aquí, por la misma razón que `loadingLabel` en
   * `Button`: el design system tiene que poder renderizarse fuera del `NextIntlClientProvider`
   * —`src/app/not-found.tsx` vive fuera de `[locale]`—. Antes había un literal en español clavado
   * en el componente, que `check:i18n` no ve porque solo mira `src/app` y `src/infra/UI`.
   *
   * Sin él no se pinta frase: mejor el icono solo que una en el idioma equivocado.
   */
  genericErrorLabel?: string;
  hint?: string;
  containerClassName?: string;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(
    {
      id: providedId,
      label,
      error,
      genericErrorLabel,
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
            "focus-ring w-full rounded-md px-3 py-2 text-text-base border bg-surface-elevation-1 transition-colors duration-fast ease-standard placeholder:text-text-support disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-elevation-2",
            // El borde dice el estado; el anillo de foco es el del sitio y no cambia con él.
            hasError
              ? "border-feedback-error"
              : "border-border focus-visible:border-pw-green",
            className,
          )}
          {...props}
        />

        {hasError ? (
          <FieldHelper id={describedBy} tone="error">
            <MdError aria-hidden="true" className="size-4" />
            {typeof error === "string" ? error : genericErrorLabel}
          </FieldHelper>
        ) : (
          <span className="block text-right mt-1 text-sm text-text-support">
            {textLength}/{maxLength}
          </span>
        )}

        {/* Support for legacy children if any */}
        {(props as { children?: React.ReactNode }).children}
      </div>
    );
  },
);
