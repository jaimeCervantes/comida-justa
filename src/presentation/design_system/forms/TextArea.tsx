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

function textValueLength(
  value: TextAreaProps["value"] | TextAreaProps["defaultValue"],
): number {
  if (value === undefined || value === null) return 0;
  if (Array.isArray(value)) return value.join("").length;

  return String(value).length;
}

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
      defaultValue,
      value,
      onBlur,
      onChange,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const id = providedId ?? generatedId;

    /* El contador arranca contando lo que ya venía escrito. Con el estado sembrado en `0`, editar
       una publicación de 1205 caracteres decía `0/2500` hasta la primera tecla. Si el campo es
       controlado la cuenta sale de `value` en cada render, así que no hace falta un efecto que
       sincronice —y que pintaría un fotograma con la cifra vieja—. */
    const [typedLength, setTypedLength] = useState(() =>
      textValueLength(defaultValue),
    );
    const textLength =
      value === undefined ? typedLength : textValueLength(value);

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      setTypedLength(event.target.value.length);
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
    /* El error manda sobre la pista: cuando el campo está mal, el hueco cuenta qué hay que
       arreglar, no lo que se sugería antes de escribir. */
    const helperText = hasError ? (message ?? genericErrorLabel) : hint;
    const showsHelper = hasError || Boolean(hint);
    const describedBy = showsHelper ? `${id}-helper` : undefined;

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
          defaultValue={defaultValue}
          value={value}
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

        {showsHelper ? (
          <FieldHelper id={describedBy} tone={hasError ? "error" : "neutral"}>
            {hasError ? (
              <MdError aria-hidden="true" className="size-4" />
            ) : null}
            {helperText}
          </FieldHelper>
        ) : null}

        {/* El contador convive con el error en vez de cederle el sitio: cuando el texto está mal
            es justo cuando importa saber cuánto cabe todavía. */}
        <span
          className={cn(
            "block text-right mt-1 text-sm",
            hasError ? "text-feedback-error" : "text-text-support",
          )}
        >
          {textLength}/{maxLength}
        </span>

        {/* Support for legacy children if any */}
        {(props as { children?: React.ReactNode }).children}
      </div>
    );
  },
);
