import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../styling/merge-class-names";

/**
 * El contenedor con fondo, borde, radio y elevación del sitio.
 *
 * Existe porque `layout.css` define `--radius-*` y `--shadow-*` desde el slice 2 y no los consumía
 * nadie: el radio se decidía archivo por archivo, con 71 `rounded-*` repartidos en 31 archivos.
 * Una tarjeta con `rounded-card` junto a otra con `rounded-lg` no es una decisión, es un descuido
 * que nadie puede ver hasta que están una al lado de la otra.
 *
 * Los colores salen de los tokens semánticos (`surface-elevation-1`, `separator`), así que **no
 * hay variantes `dark:`**: la variable ya cambia de valor con el tema.
 */
const surfaceVariants = cva("", {
  variants: {
    /**
     * La escala con nombre, y solo ella.
     *
     * El nombre dice **qué** se redondea y no cuánto mide: una tarjeta que pide `card` sigue siendo
     * correcta el día que la tarjeta cambie de radio, y ese día se toca `layout.css` una vez.
     *
     * Los tamaños de Tailwind (`md`, `lg`, `xl`, `2xl`) vivieron aquí durante los slices 10 y 11
     * porque las pantallas todavía los pedían. El slice 13 migró las doce superficies que
     * quedaban, así que se van — como este comentario decía que pasaría. Una variante que ya no usa
     * nadie es una decisión que alguien va a tomar por error.
     */
    radius: {
      /** Para superficies que redondean solo algunos lados (una caja con barra lateral). */
      none: "",
      chip: "rounded-chip",
      control: "rounded-control",
      card: "rounded-card",
      panel: "rounded-panel",
    },
    elevation: {
      none: "",
      xs: "shadow-xs",
      sm: "shadow-sm",
      md: "shadow-md",
      lg: "shadow-lg",
    },
    border: {
      none: "",
      subtle: "border border-separator",
    },
    background: {
      none: "",
      /** El fondo de la página: para bloques que no deben despegarse de ella. */
      base: "bg-surface-background",
      /** Una superficie por encima de la página: tarjetas, paneles, diálogos. */
      raised: "bg-surface-elevation-1",
      /** Un escalón más: lo que se apoya sobre una tarjeta. */
      sunken: "bg-surface-elevation-2",
    },
    /**
     * Realce al pasar el cursor. Solo para superficies que llevan a algún sitio.
     *
     * v2 lo baja de tono. Subía a `shadow-xl` y se desplazaba 4px, que con la sombra negra anterior
     * era la única forma de que se notara; con las sombras verdes y más abiertas del slice 10,
     * `md` ya se ve, y el salto se queda en 2px. La regla del sistema es que nada se mueve más de
     * 4px y que la página crece en vez de rebotar: un realce que levanta la tarjeta media pantalla
     * llama más la atención que el contenido.
     */
    interactive: {
      true: "transition-all duration-(--duration-base) ease-(--ease-natural) hover:shadow-md hover:-translate-y-0.5",
      false: "",
    },
  },
  defaultVariants: {
    /* `card` es lo que es una superficie por omisión: si hace falta otra cosa, se pide. */
    radius: "card",
    elevation: "none",
    border: "none",
    background: "none",
    interactive: false,
  },
});

export type SurfaceProps = HTMLAttributes<HTMLElement> &
  VariantProps<typeof surfaceVariants> & {
    /** El elemento a renderizar. `article` para una tarjeta, `section` para un bloque de página. */
    as?: ElementType;
    children?: ReactNode;
  };

export function Surface({
  as: Component = "div",
  radius,
  elevation,
  border,
  background,
  interactive,
  className,
  children,
  ...moreProps
}: SurfaceProps) {
  return (
    <Component
      className={cn(
        surfaceVariants({ radius, elevation, border, background, interactive }),
        className,
      )}
      {...moreProps}
    >
      {children}
    </Component>
  );
}
