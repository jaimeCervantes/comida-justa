"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { forwardRef, useId } from "react";
import { MdError, MdExpandMore } from "react-icons/md";
import { cn } from "../styling/merge-class-names";
import { FieldHelper } from "./FieldHelper";
import { FieldLabel } from "./FieldLabel";
import { InputShell } from "./InputShell";

export type SelectProps = Omit<ComponentPropsWithRef<"select">, "id"> & {
  id?: string;
  label?: string;
  labelSuffix?: ReactNode;
  error?: string | null;
  hint?: string;
  isInvalid?: boolean;
  containerClassName?: string;
  shellClassName?: string;
};

/**
 * Un desplegable con la misma caja que un campo de texto.
 *
 * Existía como una cadena de clases copiada en tres formularios —publicar, editar y el alta de
 * categorías del admin— que se había quedado atrás: `border-gray-300` en vez del token del sitio,
 * `rounded-sm` donde los demás campos son `rounded-md`, y **sin foco**. En un formulario donde el
 * título de arriba se pone verde al enfocarse y el desplegable de abajo no cambia, lo que parece es
 * que el desplegable no responde.
 *
 * Se apoya en `InputShell`, que es lo que hace que el borde, la altura y el foco sean los mismos
 * que los de `TextField` sin tener que acordarse de nada.
 *
 * **La flecha es nuestra, no la del navegador.** La nativa se pega al borde derecho —no la separa
 * el `padding` del elemento— y cada navegador la dibuja distinta. Con `appearance-none` desaparece
 * y esta se coloca donde le toca. Va con `pointer-events-none` para que al pincharla el clic caiga
 * en el `select` que tiene debajo: la nativa se puede pinchar y la nuestra tenía que seguir
 * pudiéndose.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      id: providedId,
      label,
      labelSuffix,
      error,
      hint,
      disabled,
      required,
      className,
      containerClassName,
      shellClassName,
      isInvalid,
      children,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const hasError = Boolean(error || isInvalid);
    const describedBy = (error ?? hint) ? `${id}-helper` : undefined;
    const state = disabled ? "disabled" : hasError ? "error" : "idle";

    return (
      <div className={cn("flex flex-col", containerClassName)}>
        {label && (
          <FieldLabel htmlFor={id} suffix={labelSuffix} required={required}>
            {label}
          </FieldLabel>
        )}

        <InputShell state={state} className={shellClassName}>
          <span className="relative flex min-w-0 flex-1 items-center">
            <select
              ref={ref}
              id={id}
              disabled={disabled}
              required={required}
              aria-describedby={describedBy}
              aria-invalid={hasError ? true : undefined}
              className={cn(
                "w-full appearance-none bg-transparent pr-7 text-text-base outline-none disabled:cursor-not-allowed",
                /* La lista desplegada la pinta el navegador y no hereda la caja: sin esto, en
                   tema oscuro se abre en blanco. Va por token y no por `dark:`, que solo cubre
                   `prefers-color-scheme` y se saltaba a quien elige el tema a mano. */
                "[&>option]:bg-surface-elevation-1 [&>option]:text-text-base",
                className,
              )}
              {...props}
            >
              {children}
            </select>
            <MdExpandMore
              aria-hidden="true"
              className="pointer-events-none absolute right-0 text-text-support"
            />
          </span>
        </InputShell>

        {(error ?? hint) ? (
          <FieldHelper id={describedBy} tone={hasError ? "error" : "neutral"}>
            {hasError && <MdError aria-hidden="true" className="size-4" />}
            {error ?? hint}
          </FieldHelper>
        ) : null}
      </div>
    );
  },
);
