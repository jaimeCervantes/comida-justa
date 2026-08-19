"use client";

import type { ChangeEvent, ComponentPropsWithRef, FocusEvent } from "react";
import { forwardRef, useId, useState } from "react";
import { MdError } from "react-icons/md";
import { cn } from "../styling/merge-class-names";
import { FieldHelper } from "./FieldHelper";
import { FieldLabel } from "./FieldLabel";
import { useFieldValidity } from "./useFieldValidity";
import type { ValidationMessages } from "./validity";

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
  /** Qué decir por cada regla que el navegador rechaza, ya traducido. Ver `TextField`. */
  validationMessages?: ValidationMessages;
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
      validationMessages,
      hint,
      disabled,
      required,
      className,
      containerClassName,
      maxLength = 250,
      rows = 4,
      onBlur,
      onChange,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const id = providedId ?? generatedId;

    const [textLength, setTextLength] = useState(0);

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      setTextLength(event.target.value.length);
      onChange?.(event);
    };

    /* `error` admite un booleano por compatibilidad: ahí no hay frase que enseñar, sólo el estado.
       Se separan para que el hook reciba lo que sabe manejar —una frase o nada— y el caso viejo
       siga pintando su icono. */
    const serverMessage = typeof error === "string" ? error : null;
    const legacyInvalid = error === true;

    const validity = useFieldValidity<HTMLTextAreaElement>({
      serverError: serverMessage,
      messages: validationMessages,
      forwardedRef: ref,
      onBlur: onBlur as
        | ((event: FocusEvent<HTMLTextAreaElement>) => void)
        | undefined,
      onChange: handleChange,
    });

    const message = validity.error;
    const hasError = Boolean(message) || legacyInvalid;
    const describedBy = (message ?? hint) ? `${id}-helper` : undefined;

    return (
      <div className={cn("flex flex-col mt-6", containerClassName)}>
        {label && (
          <FieldLabel htmlFor={id} required={required}>
            {label}
          </FieldLabel>
        )}

        <textarea
          ref={validity.ref}
          id={id}
          rows={rows}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          onBlur={validity.onBlur}
          onChange={validity.onChange}
          aria-describedby={describedBy}
          aria-invalid={hasError ? true : undefined}
          className={cn(
            "w-full rounded-md px-3 py-2 text-text-base border bg-surface-elevation-1 transition-colors duration-fast ease-standard placeholder:text-text-support disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-elevation-2",
            // Sin el anillo del sitio, por lo mismo que `InputShell`: el borde dice el foco.
            hasError
              ? "border-feedback-error"
              : "border-border focus:border-pw-green focus:shadow-[inset_0_0_0_1px_var(--color-pw-green)]",
            className,
          )}
          {...props}
        />

        {hasError ? (
          <FieldHelper id={describedBy} tone="error">
            <MdError aria-hidden="true" className="size-4" />
            {message ?? genericErrorLabel}
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
