import { cn } from "~/presentation/design_system/styling/merge-class-names";

/**
 * El hueco que late mientras el archivo llega.
 *
 * Vive aparte porque lo comparten la imagen y el vídeo, y porque son la misma promesa hecha al mismo
 * usuario: «esto va a aparecer aquí». Dos copias del mismo rectángulo gris habrían acabado latiendo
 * a distinto ritmo.
 *
 * Es decorativo. Quien lo mira ya sabe que está esperando porque lo ve latir; anunciarlo además a un
 * lector de pantalla sería contarle un detalle visual que no puede usar, y en un listado de nueve
 * tarjetas, contárselo nueve veces.
 */
export function MediaSkeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      data-testid="media-skeleton"
      className={cn(
        "absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700",
        className,
      )}
    />
  );
}

/**
 * El marco que lo sostiene.
 *
 * `relative` para que el esqueleto se pueda estirar dentro, y `block` porque un `span` es en línea
 * por defecto y dejaría un par de píxeles fantasma debajo del archivo.
 */
export const MEDIA_FRAME_CLASS = "relative block overflow-hidden";
