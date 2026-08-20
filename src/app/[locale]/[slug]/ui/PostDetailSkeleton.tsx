import { Skeleton } from "~/presentation/design_system/feedback/Skeleton";
import { Surface } from "~/presentation/design_system/surfaces/Surface";

/**
 * El hueco de la ficha de una publicación mientras carga.
 *
 * `aria-busy` va aquí, en el contenedor, y no en cada bloque: es esta región la que está cargando.
 * Los bloques de dentro son `aria-hidden` —no hay nada que anunciar todavía—, así que sin este
 * atributo la carga sería completamente muda para un lector de pantalla.
 */
export default function PostDetailSkeleton({
  className,
}: {
  className: string;
}) {
  return (
    <Surface
      aria-busy="true"
      radius="card"
      background="sunken"
      elevation="xs"
      className={`p-2 ${className}`}
    >
      <Skeleton className="h-[10%] w-full mb-4" />
      <Skeleton className="h-[63%] w-full mb-4" />
      <div className="h-[20%]">
        <Skeleton className="w-full h-[30%] mb-2" />
        <Skeleton className="w-full h-[30%] mb-2" />
        <Skeleton className="w-full h-[30%] mb-2" />
      </div>
    </Surface>
  );
}
