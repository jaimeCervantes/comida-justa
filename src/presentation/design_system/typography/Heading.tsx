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
    /**
     * Dónde habla cada voz, y por qué no en todas partes.
     *
     * `display` y `lg` van en Newsreader a peso 400: son lo que la marca **afirma** —la portada, el
     * nombre de un pilar—, y una serif editorial a peso normal se lee como una afirmación, no como
     * un grito. De ahí que `lg` pierda su `font-extrabold`: en una serif de óptico variable el peso
     * extra no da autoridad, da ruido.
     *
     * `md` para abajo se queda en Plus Jakarta con peso 700, porque son lo que la interfaz
     * **opera**: títulos de sección, de tarjeta, de bloque. Mezclar las dos voces en el mismo
     * tamaño es lo que hace que un sistema tipográfico se vea indeciso.
     *
     * Esto es lo que faltaba: hasta ahora `--font-display` existía, Newsreader se descargaba en
     * cada visita y no se pintaba en ningún píxel.
     */
    size: {
      display:
        "font-display text-display leading-none font-normal tracking-tight",
      lg: "font-display text-heading-lg leading-tight font-normal tracking-tight",
      md: "text-heading-md leading-tight font-bold tracking-tight",
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
