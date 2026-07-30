"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";
import { cn } from "../styling/merge-class-names";

const buttonVariants = cva(
  // `whitespace-nowrap` no es cosmético: sin él, un botón que se queda sin ancho —por ejemplo
  // cuando el hermano de al lado crece al mostrar su loader— parte la etiqueta en dos renglones
  // y el botón crece de alto, rompiendo la altura fija del header.
  "relative rounded-lg inline-flex items-center justify-center whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      color: {
        green: "bg-pw-green text-white hover:bg-pw-green/80",
        orange: "bg-pw-orange text-white hover:bg-pw-orange/80",
        black: "bg-pw-black text-white hover:bg-pw-black/80",
        white: "bg-pw-white text-black hover:bg-pw-white/80",
        default: "bg-pw-gray text-white hover:bg-pw-gray/80",
      },
      size: {
        xs: "px-2 py-2 text-xs",
        sm: "px-2 py-2 text-sm",
        md: "px-5 py-3 text-base",
        lg: "px-6 py-4 text-base",
        xl: "px-7 py-5 text-base",
      },
    },
    defaultVariants: {
      color: "default",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    startIcon?: ReactNode;
    endIcon?: ReactNode;
    isLoading?: boolean;
    showLoader?: boolean;
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
      className={cn(buttonVariants({ color, size }), className)}
      {...moreProps}
    >
      <span
        className={cn(
          "flex gap-2 items-center",
          startIcon && "ml-1",
          endIcon && "mr-1",
        )}
      >
        {startIcon && startIcon}
        {children}
        {isBtnLoading && (
          <BiLoaderAlt
            className="motion-safe:animate-spin h-5 w-5"
            title="Cargando..."
          />
        )}
        {endIcon && endIcon}
      </span>
    </button>
  );
}
