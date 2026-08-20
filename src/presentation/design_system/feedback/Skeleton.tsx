import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../styling/merge-class-names";

/**
 * El hueco que ocupa algo que todavía no llegó.
 *
 * Lleva `aria-hidden` y `role="presentation"`: para un lector de pantalla no hay nada que anunciar
 * —el contenido aún no existe— y leer «imagen, imagen, imagen» mientras carga es peor que el
 * silencio. Quien avisa de que se está cargando es el contenedor, con `aria-busy`.
 *
 * La animación va bajo `motion-safe`, que respeta a quien pidió menos movimiento en su sistema: el
 * brillo que recorre el bloque es exactamente el tipo de animación que provoca mareo.
 */
const skeletonVariants = cva(
  "relative overflow-hidden bg-surface-elevation-2 motion-safe:before:absolute motion-safe:before:inset-0 motion-safe:before:-translate-x-full motion-safe:before:animate-[shine_2s_infinite] motion-safe:before:bg-linear-to-r motion-safe:before:from-transparent motion-safe:before:via-pw-white/60 motion-safe:before:to-transparent dark:motion-safe:before:via-pw-white/20",
  {
    variants: {
      /* `card` y `panel` son la escala con nombre del slice 10: el hueco tiene que tener la forma
         exacta de lo que va a llegar, así que su radio se pide igual que el de la superficie. */
      radius: {
        none: "",
        chip: "rounded-chip",
        control: "rounded-control",
        card: "rounded-card",
        panel: "rounded-panel",
        pill: "rounded-full",
      },
    },
    defaultVariants: { radius: "chip" },
  },
);

export type SkeletonProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof skeletonVariants>;

export function Skeleton({ radius, className, ...moreProps }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={cn(skeletonVariants({ radius }), className)}
      {...moreProps}
    />
  );
}
