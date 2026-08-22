"use client";

import type { VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";
import { cn } from "../styling/merge-class-names";
import { buttonVariants } from "./buttonVariants";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    startIcon?: ReactNode;
    endIcon?: ReactNode;
    isLoading?: boolean;
    showLoader?: boolean;
    /**
     * Texto del `title` de la ruedita de carga.
     *
     * Se recibe como prop y **no** se lee del catálogo aquí a propósito. El design system tiene que
     * poder renderizarse en cualquier parte, y hay un sitio del árbol que vive fuera del
     * `NextIntlClientProvider`: `src/app/not-found.tsx`, que está fuera de `[locale]`. Cuando este
     * botón llamaba a `useTranslations`, ese 404 pasaba a ser un 500. Lo mismo pasaría el día que
     * se añada un `global-error.tsx`, que también renderiza fuera de todo proveedor.
     *
     * Sin este prop no se pinta `title`: mejor sin etiqueta que con una en el idioma equivocado.
     */
    loadingLabel?: string;
  };

export function Button({
  className,
  size,
  color,
  disabled,
  type = "button",
  onClick,
  children,
  startIcon,
  endIcon,
  isLoading,
  showLoader,
  loadingLabel,
  ...moreProps
}: ButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (showLoader && onClick) {
      setInternalLoading(true);
      try {
        await onClick(e);
      } finally {
        setInternalLoading(false);
      }
    } else if (onClick) {
      onClick(e);
    }
  };

  const isBtnLoading = isLoading || internalLoading;

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || isBtnLoading}
      aria-busy={isBtnLoading}
      className={cn(buttonVariants({ color, size }), className)}
      {...moreProps}
    >
      {/* La ruedita va superpuesta y el contenido se oculta con `invisible`, que conserva su
          espacio. Si el loader se sumara al flujo, el botón crecería ~28px al pulsarlo (icono
          + `gap`) y empujaría a sus hermanos: es lo que hacía brincar el menú entero al pulsar
          "Publicar" o "Iniciar sesión". El ancho tiene que ser el mismo antes y durante la carga. */}
      <span
        className={cn(
          "flex gap-2 items-center",
          startIcon && "ml-1",
          endIcon && "mr-1",
          isBtnLoading && "invisible",
        )}
      >
        {startIcon && startIcon}
        {children}
        {endIcon && endIcon}
      </span>
      {isBtnLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <BiLoaderAlt
            className="motion-safe:animate-spin h-5 w-5"
            title={loadingLabel}
          />
        </span>
      )}
    </button>
  );
}
