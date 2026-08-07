import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../styling/merge-class-names";

/**
 * El texto que no es encabezado.
 *
 * La variante dice **qué papel cumple** el texto, no cuánto mide: `label` en vez de `text-sm`. Así
 * la escala se ajusta en `typography.css` y no en los 99 sitios donde hoy está escrito `text-sm`.
 */
const textVariants = cva("", {
  variants: {
    variant: {
      /** Un párrafo largo: interlineado holgado para poder leerlo seguido. */
      body: "text-body leading-relaxed",
      lead: "text-body-lg leading-relaxed",
      /** La etiqueta de un campo, el pie de una tarjeta. */
      label: "text-label leading-normal",
      caption: "text-caption leading-normal",
      /** Avisos legales y notas al pie. Por debajo de esto no se lee. */
      tiny: "text-tiny leading-normal",
    },
    tone: {
      base: "text-text-base",
      support: "text-text-support",
      inverse: "text-text-inverse",
      inherit: "",
    },
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: { variant: "body", tone: "base", weight: "regular" },
});

export type TextProps = HTMLAttributes<HTMLElement> &
  VariantProps<typeof textVariants> & {
    /** `p` por defecto; `span` cuando va dentro de otra línea de texto. */
    as?: ElementType;
    children?: ReactNode;
  };

export function Text({
  as: Component = "p",
  variant,
  tone,
  weight,
  className,
  children,
  ...moreProps
}: TextProps) {
  return (
    <Component
      className={cn(textVariants({ variant, tone, weight }), className)}
      {...moreProps}
    >
      {children}
    </Component>
  );
}
