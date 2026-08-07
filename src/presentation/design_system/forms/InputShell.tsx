import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "../styling/merge-class-names";

/**
 * El borde dice el **estado** y el anillo dice dónde está el foco. Antes los dos los decía el
 * anillo: en un campo con error el foco se pintaba rojo, así que la única señal de "estás aquí"
 * cambiaba de color según la validación y se confundía con ella. Ahora el anillo es el mismo del
 * sitio (`focus-ring-within`, en `tokens/focus.css`) y el borde conserva el estado.
 */
export const inputShellClassName = cva(
  [
    "focus-ring-within flex h-12 w-full items-center gap-2 rounded-md px-3",
    "border bg-surface-elevation-1 text-body text-text-base",
    "transition-colors duration-fast ease-standard",
    "[&_svg]:size-5 [&_svg]:shrink-0",
  ],
  {
    variants: {
      state: {
        idle: "border-border [&>svg:first-child]:text-text-support focus-within:border-pw-green",
        error: "border-feedback-error [&>svg:first-child]:text-feedback-error",
        disabled:
          "border-border opacity-50 bg-surface-elevation-2 [&>svg:first-child]:text-text-support cursor-not-allowed",
      },
    },
    defaultVariants: { state: "idle" },
  },
);

export type InputShellProps = ComponentPropsWithRef<"div"> &
  VariantProps<typeof inputShellClassName> & {
    leadingIcon?: ReactNode;
    trailingAdornment?: ReactNode;
  };

export function InputShell({
  state,
  leadingIcon,
  trailingAdornment,
  children,
  className,
  ...props
}: InputShellProps) {
  return (
    <div
      className={cn(inputShellClassName({ state }), className)}
      data-state={state ?? "idle"}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingAdornment ? (
        <span className="ml-auto flex items-center">{trailingAdornment}</span>
      ) : null}
    </div>
  );
}
