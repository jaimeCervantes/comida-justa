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
  // `focus-ring` es el anillo del sistema (`tokens/focus.css`). El botón no tenía **ninguno**: al
  // navegar con teclado no había forma de saber dónde estabas.
  // `rounded-control` es la escala con nombre del slice 10: el botón deja de elegir un número.
  "focus-ring relative rounded-control inline-flex items-center justify-center whitespace-nowrap font-semibold transition-colors duration-fast disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      /**
       * Cada color pide su **par** —relleno y el texto que le toca—, no un hex de marca.
       *
       * El slice 10 arregló el token: `--brand-green` dejó de ser la semilla del logo (3.92 con
       * blanco) y pasó al relleno que sí cumple. Pero mientras aquí pusiera `bg-pw-green
       * text-white`, este componente seguía eligiendo el texto por su cuenta, y en oscuro eso se
       * rompe: ahí el relleno se aclara a `#6ba34a` y lo que va encima es tinta oscura, no blanco.
       *
       * Pidiendo el par, el tema mueve las dos variables a la vez y el botón no se entera.
       * `brandPalette.contrast.test.ts` mide justamente esas parejas en los dos temas.
       */
      color: {
        green:
          "bg-button-primary-bg text-button-primary-text hover:bg-button-primary-hover",
        orange:
          "bg-button-buy-bg text-button-buy-text hover:bg-button-buy-hover",
        black: "bg-pw-black text-pw-white hover:bg-pw-black/90",
        white:
          "bg-surface-elevation-1 text-text-base hover:bg-surface-elevation-2",
        default:
          "bg-button-secondary-bg text-button-secondary-text hover:bg-button-secondary-hover",
      },
      /**
       * La altura mínima va declarada y no se deja al relleno.
       *
       * 44px es el objetivo táctil con el que un pulgar acierta, y `md` —el tamaño por omisión— lo
       * cumple con margen. `xs` y `sm` existen para barras densas de escritorio; declaran su altura
       * igual, para que se vea de un vistazo que no llegan y nadie los ponga en un teléfono
       * creyendo que sí.
       */
      size: {
        xs: "min-h-8 px-3 py-1.5 text-xs",
        sm: "min-h-10 px-4 py-2 text-sm",
        md: "min-h-12 px-5 py-3 text-base",
        lg: "min-h-14 px-6 py-4 text-base",
        xl: "min-h-16 px-7 py-5 text-base",
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
