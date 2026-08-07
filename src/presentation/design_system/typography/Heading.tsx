import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../styling/merge-class-names";

/**
 * Un encabezado del sitio.
 *
 * **El nivel y el tamaño son props distintas a propósito.** El nivel es estructura —lo que leen un
 * lector de pantalla y un buscador— y el tamaño es apariencia. Atarlos obliga a elegir entre una
 * jerarquía correcta y un diseño correcto, y quien tiene prisa siempre elige el diseño: así es como
 * aparece un `<h1>` en mitad de una tarjeta porque tenía que verse grande. Aquí un `h2` puede verse
 * pequeño sin mentir sobre la estructura del documento.
 *
 * Si no se pide tamaño, se deduce del nivel, que es lo que se quiere casi siempre.
 */
const headingVariants = cva("text-balance", {
  variants: {
    size: {
      lg: "text-heading-lg leading-tight font-extrabold tracking-tight",
      md: "text-heading-md leading-tight font-bold",
      sm: "text-heading-sm leading-tight font-bold",
      xs: "text-body-lg leading-tight font-semibold",
    },
    tone: {
      base: "text-text-base",
      support: "text-text-support",
      inverse: "text-text-inverse",
      /** El color lo pone quien llama (el token de un pilar, por ejemplo). */
      inherit: "",
    },
  },
  defaultVariants: { size: "md", tone: "base" },
});

type HeadingSize = NonNullable<VariantProps<typeof headingVariants>["size"]>;

/** El tamaño que corresponde a cada nivel cuando nadie pide otro. */
const SIZE_FOR_LEVEL: Record<1 | 2 | 3 | 4, HeadingSize> = {
  1: "lg",
  2: "md",
  3: "sm",
  4: "xs",
};

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & {
    /** El nivel del documento: `1` produce `<h1>`. Nunca lo decide la apariencia. */
    level: 1 | 2 | 3 | 4;
    children?: ReactNode;
  };

export function Heading({
  level,
  size,
  tone,
  className,
  children,
  ...moreProps
}: HeadingProps) {
  const Tag = `h${level}` as const;

  return (
    <Tag
      className={cn(
        headingVariants({ size: size ?? SIZE_FOR_LEVEL[level], tone }),
        className,
      )}
      {...moreProps}
    >
      {children}
    </Tag>
  );
}
