"use client";

import type {
  ChangeEvent,
  ComponentPropsWithRef,
  FocusEvent,
  ReactNode,
} from "react";
import { forwardRef, useId } from "react";
import { MdError } from "react-icons/md";
import { cn } from "../styling/merge-class-names";
import { FieldHelper } from "./FieldHelper";
import { FieldLabel } from "./FieldLabel";
import { InputShell } from "./InputShell";
import { useFieldValidity } from "./useFieldValidity";
import type { ValidationMessages } from "./validity";

export type TextFieldProps = Omit<ComponentPropsWithRef<"input">, "id"> & {
  id?: string;
  label?: string;
  labelSuffix?: ReactNode;

  /** Maps to legacy `icon` */
  icon?: ReactNode;
  leadingIcon?: ReactNode;

  /** Maps to legacy `iconEnd` */
  iconEnd?: ReactNode;
  trailingAdornment?: ReactNode;

  /** Lo que contestó la Server Action. Comparte hueco con el veredicto del navegador. */
  error?: string | null;
  hint?: string;

  /**
   * Qué decir por cada regla que el navegador puede rechazar (`required`, `pattern`, `min`…), ya
   * traducido. Sin esto el campo se sigue validando y se sigue marcando en rojo, pero calla: el
   * design system no lee el catálogo. Lo normal es que las ponga el `Form` para todos sus campos y
   * que aquí sólo se pise lo que este campo dice distinto.
   */
  validationMessages?: ValidationMessages;

  /** Legacy prop support */
  isInvalid?: boolean;
  containerClassName?: string;
  shellClassName?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      id: providedId,
      label,
      labelSuffix,
      icon,
      leadingIcon,
      iconEnd,
      trailingAdornment,
      error,
      hint,
      validationMessages,
      disabled,
      required,
      className,
      containerClassName,
      shellClassName,
      isInvalid,
      onBlur,
      onChange,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const validity = useFieldValidity<HTMLInputElement>({
      serverError: error,
      messages: validationMessages,
      forwardedRef: ref,
      onBlur: onBlur as
        | ((event: FocusEvent<HTMLInputElement>) => void)
        | undefined,
      onChange: onChange as
        | ((event: ChangeEvent<HTMLInputElement>) => void)
        | undefined,
    });

    const message = validity.error;
    const hasError = Boolean(message || isInvalid);
    const describedBy = (message ?? hint) ? `${id}-helper` : undefined;
    const state = disabled ? "disabled" : hasError ? "error" : "idle";

    const actualLeadingIcon = leadingIcon ?? icon;
    const actualTrailingAdornment = trailingAdornment ?? iconEnd;

    return (
      <div className={cn("flex flex-col", containerClassName)}>
        {label && (
          <FieldLabel htmlFor={id} suffix={labelSuffix} required={required}>
            {label}
          </FieldLabel>
        )}

        <InputShell
          state={state}
          leadingIcon={actualLeadingIcon}
          trailingAdornment={actualTrailingAdornment}
          className={shellClassName}
        >
          <input
            ref={validity.ref}
            id={id}
            disabled={disabled}
            required={required}
            onBlur={validity.onBlur}
            onChange={validity.onChange}
            aria-describedby={describedBy}
            aria-invalid={hasError ? true : undefined}
            className={cn(
              "min-w-0 flex-1 bg-transparent text-text-base outline-none placeholder:text-text-support disabled:cursor-not-allowed",
              className,
            )}
            {...props}
          />
        </InputShell>

        {(message ?? hint) ? (
          <FieldHelper id={describedBy} tone={hasError ? "error" : "neutral"}>
            {hasError && <MdError aria-hidden="true" className="size-4" />}
            {message ?? hint}
          </FieldHelper>
        ) : null}

        {/* Fallback for legacy children support, if any old component passed children.
          The new TextField doesn't support children directly in props type by default from ComponentPropsWithRef<"input">,
          but we cast them safely if they leak through. */}
        {(props as { children?: React.ReactNode }).children}
      </div>
    );
  },
);
