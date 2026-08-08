import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "../styling/merge-class-names";

/**
 * El borde dice el estado **y** el foco: al enfocar se pone verde, y con error se queda rojo, que
 * es la señal que manda. No lleva el anillo del sitio (`tokens/focus.css`) a propósito.
 *
 * Se probó con los dos —anillo fuera, borde dentro— y quedaban dos verdes concéntricos separados
 * por 2 px alrededor de cada campo. En una pantalla con varios campos es ruido, y el campo es
 * justo el elemento donde el cursor de texto ya dice dónde estás. El anillo se queda donde no hay
 * otra señal: botones, avatar, paginación, tarjetas.
 */
export const inputShellClassName = cva(
  [
    "flex h-12 w-full items-center gap-2 rounded-md px-3",
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
