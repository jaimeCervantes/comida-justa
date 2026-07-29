"use client";

import { forwardRef, useId } from "react";
import { MdError } from "react-icons/md";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { FieldHelper } from "./FieldHelper";
import { FieldLabel } from "./FieldLabel";
import { InputShell } from "./InputShell";
import { cn } from "../styling/merge-class-names";

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
  
  error?: string | null;
  hint?: string;
  
  /** Legacy prop support */
  isInvalid?: boolean;
  containerClassName?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
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
    disabled,
    required,
    className,
    containerClassName,
    isInvalid,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const hasError = Boolean(error || isInvalid);
  const describedBy = (error ?? hint) ? `${id}-helper` : undefined;
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
      >
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={hasError ? true : undefined}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-text-base outline-none placeholder:text-text-support disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
      </InputShell>

      {(error ?? hint) ? (
        <FieldHelper id={describedBy} tone={hasError ? "error" : "neutral"}>
          {hasError && <MdError aria-hidden="true" className="size-4" />}
          {error ?? hint}
        </FieldHelper>
      ) : null}
      
      {/* Fallback for legacy children support, if any old component passed children. 
          The new TextField doesn't support children directly in props type by default from ComponentPropsWithRef<"input">,
          but we cast them safely if they leak through. */}
      {(props as any).children}
    </div>
  );
});
