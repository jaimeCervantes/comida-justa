"use client";

import type {
  ChangeEvent,
  ComponentPropsWithRef,
  FocusEvent,
  ReactNode,
} from "react";
import { forwardRef, useId } from "react";
import { MdError } from "react-icons/md";
import { ChevronDown } from "../icons/ChevronDown";
import { cn } from "../styling/merge-class-names";
import { FieldHelper } from "./FieldHelper";
import { FieldLabel } from "./FieldLabel";
import { InputShell } from "./InputShell";
import { useFieldValidity } from "./useFieldValidity";
import type { ValidationMessages } from "./validity";

export type SelectProps = Omit<ComponentPropsWithRef<"select">, "id"> & {
  id?: string;
  label?: string;
  labelSuffix?: ReactNode;
  error?: string | null;
  hint?: string;
  /** Qué decir por cada regla que el navegador rechaza, ya traducido. Ver `TextField`. */
  validationMessages?: ValidationMessages;
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
 *
 * **La lista que se despliega no es nuestra y no puede serlo**: la pinta el sistema. Sigue el tema
 * porque `colors.css` declara `color-scheme`, que es lo único que un navegador acepta para eso.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      id: providedId,
      label,
      labelSuffix,
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
      children,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const validity = useFieldValidity<HTMLSelectElement>({
      serverError: error,
      messages: validationMessages,
      forwardedRef: ref,
      onBlur: onBlur as
        | ((event: FocusEvent<HTMLSelectElement>) => void)
        | undefined,
      onChange: onChange as
        | ((event: ChangeEvent<HTMLSelectElement>) => void)
        | undefined,
    });

    const message = validity.error;
    const hasError = Boolean(message || isInvalid);
    const describedBy = (message ?? hint) ? `${id}-helper` : undefined;
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
              ref={validity.ref}
              id={id}
              disabled={disabled}
              required={required}
              onBlur={validity.onBlur}
              onChange={validity.onChange}
              aria-describedby={describedBy}
              aria-invalid={hasError ? true : undefined}
              className={cn(
                "w-full appearance-none bg-transparent pr-7 text-text-base outline-none disabled:cursor-not-allowed",
                className,
              )}
              {...props}
            >
              {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 text-text-support" />
          </span>
        </InputShell>

        {(message ?? hint) ? (
          <FieldHelper id={describedBy} tone={hasError ? "error" : "neutral"}>
            {hasError && <MdError aria-hidden="true" className="size-4" />}
            {message ?? hint}
          </FieldHelper>
        ) : null}
      </div>
    );
  },
);
